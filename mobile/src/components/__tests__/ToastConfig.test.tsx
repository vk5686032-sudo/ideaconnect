import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';

import { toastConfig } from '@/components/ToastConfig';

/**
 * Regression: the notification banner was rendered from `onAction`, but
 * react-native-toast-message v2 renamed that prop to `onPress` and dropped
 * `onAction` entirely. The library therefore never passed it through, so
 * ToastCard always saw `undefined`, bailed out of the Pressable branch, and
 * rendered a dead View. It looked correct and did nothing -- tapping a
 * notification could not navigate anywhere.
 *
 * These go through the real per-type config, so a rename on either side of the
 * boundary breaks the test rather than the app.
 *
 * Note on assertions: react-native-testing-library's fireEvent.press is a
 * SILENT no-op when it cannot find a pressable ancestor -- it does not throw.
 * Asserting only "onPress was called" would therefore have passed vacuously
 * against the broken component, which is exactly what happened on the first
 * attempt at this test. So the presence of the responder wiring is asserted
 * separately: a Pressable puts onStartShouldSetResponder/onClick on the
 * rendered root, a dead View has only className there.
 */
const isPressable = (): boolean => {
  const root = screen.toJSON() as { props?: Record<string, unknown> } | null;
  const props = root?.props ?? {};
  return 'onStartShouldSetResponder' in props || 'onClick' in props;
};

/**
 * The per-type renderer is typed as receiving the full ToastConfigParams
 * (position, type, isVisible, show, hide, ...) because the library injects all
 * of those at render time. A test only supplies the fields the custom toast
 * actually reads, so the rest are stubbed rather than left to `any` at each
 * call site.
 */
const params = (over: Record<string, unknown>) =>
  ({
    position: 'top',
    type: 'info',
    isVisible: true,
    visible: true,
    hide: () => {},
    show: () => {},
    props: {},
    ...over,
  }) as unknown as React.ComponentProps<NonNullable<typeof toastConfig.info>>;

describe('toast config renderers', () => {
  it('renders an info toast as pressable and fires onPress', () => {
    const onPress = jest.fn();
    const Renderer = toastConfig.info!;

    render(<Renderer {...params({ text1: 'New like on your idea', text2: 'James liked it', onPress })} />);

    // Must actually be a Pressable, not just "press does not throw".
    expect(isPressable()).toBe(true);

    fireEvent.press(screen.getByText('New like on your idea'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('renders a plain card with no pressable when there is no action', () => {
    const Renderer = toastConfig.info!;
    render(<Renderer {...params({ text1: 'Saved', text2: 'All good' })} />);

    expect(screen.getByText('Saved')).toBeTruthy();
    expect(isPressable()).toBe(false);
  });

  it('passes the action through for the success and error tones too', () => {
    for (const tone of ['success', 'error'] as const) {
      const onPress = jest.fn();
      const Renderer = toastConfig[tone]!;
      const { unmount } = render(<Renderer {...params({ type: tone, text1: `${tone} title`, onPress })} />);
      expect(isPressable()).toBe(true);
      fireEvent.press(screen.getByText(`${tone} title`));
      expect(onPress).toHaveBeenCalledTimes(1);
      unmount();
    }
  });
});
