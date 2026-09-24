import assert from 'node:assert/strict';
import test from 'node:test';
import { mountCheckoutAction, MonriCheckoutError } from '../dist/index.js';

const action = {
  type: 'monri_components', payment_id: '3e6b7f70-4d2f-4f0e-9b7b-5d3b6c0a51d2',
  environment: 'test', authenticity_token: 'test-token', client_secret: 'test-session-secret',
};
const billing = {
  fullName: 'Test Buyer', address: 'Test Street 1', city: 'Sarajevo', zip: '71000',
  phone: '+38761123456', country: 'BA', email: 'buyer@example.test',
};

test('Monri Components uses hosted card entry and one deliberate submit, never browser cash proof', async (t) => {
  const descriptors = new Map(['window', 'document'].map((name) => [name, Object.getOwnPropertyDescriptor(globalThis, name)]));
  let native;
  const target = { isConnected: true, children: [], appendChild(child) { child.parent = this; this.children.push(child); } };
  const script = { src: 'https://ipgtest.monri.com/dist/components.js' };
  const document = {
    scripts: [script],
    querySelector: (selector) => selector === '#payment' ? target : null,
    head: { appendChild() { assert.fail('A preloaded official script must not be loaded again'); } },
    createElement(tag) {
      assert.equal(tag, 'div');
      return { id: '', remove() { this.parent.children = this.parent.children.filter((child) => child !== this); } };
    },
  };
  const window = {
    location: { protocol: 'https:' }, setTimeout, clearTimeout,
    Monri(token) {
      assert.equal(token, action.authenticity_token);
      return {
        components(options) {
          assert.deepEqual(options, { clientSecret: action.client_secret });
          return { create(type, options) {
            assert.equal(type, 'card');
            assert.deepEqual(options, { tokenizePan: false, tokenizePanOffered: false, showInstallmentsSelection: false });
            return native.card;
          } };
        },
        async confirmPayment(card, details) {
          assert.equal(card, native.card);
          native.calls.push(details);
          return native.respond();
        },
      };
    },
  };
  for (const [name, value] of Object.entries({ window, document })) Object.defineProperty(globalThis, name, { configurable: true, value });
  t.after(() => {
    for (const [name, descriptor] of descriptors) {
      if (descriptor) Object.defineProperty(globalThis, name, descriptor);
      else delete globalThis[name];
    }
  });
  const hasCode = (code) => (error) => error instanceof MonriCheckoutError && error.code === code;
  const setup = (respond = () => ({ result: { status: 'approved', order_number: action.payment_id } })) => {
    native = {
      calls: [], respond, changed: null,
      card: {
        mount(id) { assert.equal(id, target.children.at(-1).id); assert.match(id, /^arky-monri-/); },
        onChange(listener) { native.changed = listener; },
      },
    };
  };

  await t.test('invalid actions and insecure origins cannot initialize card entry', async () => {
    await assert.rejects(mountCheckoutAction({ ...action, merchant_key: 'private' }, target), hasCode('invalid_action'));
    window.location.protocol = 'http:';
    await assert.rejects(mountCheckoutAction(action, target), hasCode('unavailable'));
    window.location.protocol = 'https:';
    document.scripts = [];
    await assert.rejects(mountCheckoutAction(action, target), hasCode('unavailable'));
    document.scripts = [script];
    assert.equal(target.children.length, 0);
  });

  await t.test('mount and field validation never submit; only valid billing can submit once', async () => {
    setup();
    let completed = 0;
    const errors = [];
    const mounted = await mountCheckoutAction(action, '#payment', { onComplete: () => { completed += 1; }, onValidationError: (error) => errors.push(error) });
    assert.equal(mounted.type, 'monri_components');
    assert.equal(native.calls.length, 0);
    native.changed({ error: { message: 'untrusted provider payload' } });
    native.changed({ error: null });
    assert.deepEqual(errors, ['Check the card details before submitting payment.', null]);
    await assert.rejects(mounted.confirm({ ...billing, fullName: '' }), hasCode('invalid_details'));
    assert.equal(native.calls.length, 0);
    assert.equal(await mounted.confirm({ ...billing, unknown: 'must not be forwarded' }), undefined);
    assert.deepEqual(native.calls, [{ ...billing, orderInfo: `ARKY payment ${action.payment_id}` }]);
    assert.equal(completed, 1);
    await assert.rejects(mounted.confirm(billing), hasCode('already_submitted'));
    assert.equal(native.calls.length, 1);
    mounted.destroy();
    native.changed({ error: { message: 'late event' } });
    assert.equal(errors.length, 2);
    assert.equal(target.children.length, 0);
  });

  await t.test('ambiguous or mismatched native results never report completion or permit another submit', async () => {
    for (const respond of [
      () => { throw new Error('private transport body'); },
      () => ({ error: { message: 'private response body' } }),
      () => ({ result: { status: 'approved', order_number: 'different-payment' } }),
      () => ({ result: { status: 'unknown', order_number: action.payment_id } }),
      () => null,
    ]) {
      setup(respond);
      let completed = 0;
      const mounted = await mountCheckoutAction(action, target, { onComplete: () => { completed += 1; } });
      await assert.rejects(mounted.confirm(billing), (error) => hasCode('unknown_result')(error) && !error.message.includes('private'));
      await assert.rejects(mounted.confirm(billing), hasCode('already_submitted'));
      assert.equal(native.calls.length, 1);
      assert.equal(completed, 0);
      mounted.destroy();
    }
  });

  await t.test('definite decline requests the same authoritative read rather than reporting paid', async () => {
    setup(() => ({ result: { status: 'declined', order_number: action.payment_id } }));
    let completed = 0;
    const mounted = await mountCheckoutAction(action, target, { onComplete: () => { completed += 1; } });
    assert.equal(await mounted.confirm(billing), undefined);
    assert.equal(completed, 1);
    assert.equal(native.calls.length, 1);
    mounted.unmount();
    await assert.rejects(mounted.confirm(billing), hasCode('unavailable'));
  });

  await t.test('concurrent submit and completion after disposal cannot duplicate the native request', async () => {
    let finish;
    setup(() => new Promise((resolve) => { finish = resolve; }));
    let completed = 0;
    const mounted = await mountCheckoutAction(action, target, { onComplete: () => { completed += 1; } });
    const pending = mounted.confirm(billing);
    await assert.rejects(mounted.confirm(billing), hasCode('already_submitted'));
    mounted.destroy();
    finish({ result: { status: 'approved', order_number: action.payment_id } });
    await pending;
    assert.equal(completed, 0);
    assert.equal(native.calls.length, 1);
    assert.equal(target.children.length, 0);
  });

  await t.test('a page cannot mix native provider environments or mount into a missing container', async () => {
    await assert.rejects(mountCheckoutAction({ ...action, environment: 'live' }, target), hasCode('unavailable'));
    await assert.rejects(mountCheckoutAction(action, '#missing'), hasCode('unavailable'));
    target.isConnected = false;
    await assert.rejects(mountCheckoutAction(action, target), hasCode('unavailable'));
    assert.equal(target.children.length, 0);
  });
});
