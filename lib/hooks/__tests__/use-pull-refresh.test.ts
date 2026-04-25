import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { usePullRefresh } from "../use-pull-refresh";

describe("usePullRefresh", () => {
  let originalScrollY: number;

  beforeEach(() => {
    originalScrollY = window.scrollY;
    Object.defineProperty(window, "scrollY", { value: 0, writable: true });
    Object.defineProperty(document.documentElement, "scrollTop", { value: 0, writable: true });
  });

  afterEach(() => {
    Object.defineProperty(window, "scrollY", { value: originalScrollY, writable: true });
    vi.clearAllMocks();
  });

  it("should initialize with default state", () => {
    const onRefresh = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => usePullRefresh({ onRefresh }));

    expect(result.current.state).toEqual({
      pullDistance: 0,
      isTriggered: false,
      isRefreshing: false,
    });
  });

  it("should track touch start when at top of page", () => {
    const onRefresh = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => usePullRefresh({ onRefresh }));

    act(() => {
      result.current.handlers.onTouchStart({
        touches: [{ clientY: 100 }],
      } as unknown as React.TouchEvent);
    });

    // State shouldn't change on touch start alone
    expect(result.current.state.pullDistance).toBe(0);
  });

  it("should track pull distance when pulling down", () => {
    const onRefresh = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => usePullRefresh({ onRefresh }));

    act(() => {
      result.current.handlers.onTouchStart({
        touches: [{ clientY: 100 }],
      } as unknown as React.TouchEvent);
    });

    act(() => {
      result.current.handlers.onTouchMove({
        touches: [{ clientY: 200 }],
        preventDefault: vi.fn(),
      } as unknown as React.TouchEvent);
    });

    expect(result.current.state.pullDistance).toBeGreaterThan(0);
  });

  it("should trigger refresh when pull distance exceeds threshold", async () => {
    const onRefresh = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => usePullRefresh({ onRefresh, threshold: 50 }));

    act(() => {
      result.current.handlers.onTouchStart({
        touches: [{ clientY: 0 }],
      } as unknown as React.TouchEvent);
    });

    act(() => {
      result.current.handlers.onTouchMove({
        touches: [{ clientY: 200 }],
        preventDefault: vi.fn(),
      } as unknown as React.TouchEvent);
    });

    expect(result.current.state.isTriggered).toBe(true);

    act(() => {
      result.current.handlers.onTouchEnd();
    });

    await waitFor(() => {
      expect(onRefresh).toHaveBeenCalled();
    });
  });

  it("should not trigger refresh when pull distance is below threshold", () => {
    const onRefresh = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => usePullRefresh({ onRefresh, threshold: 100 }));

    act(() => {
      result.current.handlers.onTouchStart({
        touches: [{ clientY: 0 }],
      } as unknown as React.TouchEvent);
    });

    act(() => {
      result.current.handlers.onTouchMove({
        touches: [{ clientY: 50 }],
        preventDefault: vi.fn(),
      } as unknown as React.TouchEvent);
    });

    act(() => {
      result.current.handlers.onTouchEnd();
    });

    expect(onRefresh).not.toHaveBeenCalled();
    expect(result.current.state.pullDistance).toBe(0);
  });

  it("should not respond when disabled", () => {
    const onRefresh = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => usePullRefresh({ onRefresh, disabled: true }));

    act(() => {
      result.current.handlers.onTouchStart({
        touches: [{ clientY: 0 }],
      } as unknown as React.TouchEvent);
    });

    act(() => {
      result.current.handlers.onTouchMove({
        touches: [{ clientY: 200 }],
        preventDefault: vi.fn(),
      } as unknown as React.TouchEvent);
    });

    expect(result.current.state.pullDistance).toBe(0);
  });

  it("should not trigger during an ongoing refresh", async () => {
    let resolveRefresh: () => void;
    const onRefresh = vi.fn().mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveRefresh = resolve;
        })
    );
    const { result } = renderHook(() => usePullRefresh({ onRefresh, threshold: 50 }));

    // First pull to trigger refresh
    act(() => {
      result.current.handlers.onTouchStart({
        touches: [{ clientY: 0 }],
      } as unknown as React.TouchEvent);
    });

    act(() => {
      result.current.handlers.onTouchMove({
        touches: [{ clientY: 200 }],
        preventDefault: vi.fn(),
      } as unknown as React.TouchEvent);
    });

    act(() => {
      result.current.handlers.onTouchEnd();
    });

    await waitFor(() => {
      expect(result.current.state.isRefreshing).toBe(true);
    });

    // Try to pull again while refreshing
    act(() => {
      result.current.handlers.onTouchStart({
        touches: [{ clientY: 0 }],
      } as unknown as React.TouchEvent);
    });

    act(() => {
      result.current.handlers.onTouchMove({
        touches: [{ clientY: 200 }],
        preventDefault: vi.fn(),
      } as unknown as React.TouchEvent);
    });

    // Should still be at the threshold position, not tracking new pulls
    expect(onRefresh).toHaveBeenCalledTimes(1);

    // Complete the refresh
    act(() => {
      resolveRefresh();
    });

    await waitFor(() => {
      expect(result.current.state.isRefreshing).toBe(false);
    });
  });

  it("should apply resistance to pull distance", () => {
    const onRefresh = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => usePullRefresh({ onRefresh, maxPull: 150 }));

    act(() => {
      result.current.handlers.onTouchStart({
        touches: [{ clientY: 0 }],
      } as unknown as React.TouchEvent);
    });

    act(() => {
      result.current.handlers.onTouchMove({
        touches: [{ clientY: 300 }],
        preventDefault: vi.fn(),
      } as unknown as React.TouchEvent);
    });

    // With 0.5 resistance, 300px pull should result in 150px (capped at maxPull)
    expect(result.current.state.pullDistance).toBeLessThanOrEqual(150);
  });

  it("should not track upward pulls", () => {
    const onRefresh = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => usePullRefresh({ onRefresh }));

    act(() => {
      result.current.handlers.onTouchStart({
        touches: [{ clientY: 100 }],
      } as unknown as React.TouchEvent);
    });

    act(() => {
      result.current.handlers.onTouchMove({
        touches: [{ clientY: 50 }],
        preventDefault: vi.fn(),
      } as unknown as React.TouchEvent);
    });

    expect(result.current.state.pullDistance).toBe(0);
  });

  it("should handle missing touch data", () => {
    const onRefresh = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => usePullRefresh({ onRefresh }));

    act(() => {
      result.current.handlers.onTouchStart({
        touches: [],
      } as unknown as React.TouchEvent);
    });

    act(() => {
      result.current.handlers.onTouchMove({
        touches: [],
        preventDefault: vi.fn(),
      } as unknown as React.TouchEvent);
    });

    expect(result.current.state.pullDistance).toBe(0);
  });
});
