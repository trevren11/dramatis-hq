import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useSwipe } from "../use-swipe";

describe("useSwipe", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should initialize with default state", () => {
    const { result } = renderHook(() => useSwipe());

    expect(result.current.state).toEqual({
      offsetX: 0,
      isSwiping: false,
      direction: null,
    });
  });

  it("should track touch start", () => {
    const { result } = renderHook(() => useSwipe());

    act(() => {
      result.current.handlers.onTouchStart({
        touches: [{ clientX: 100, clientY: 50 }],
      } as unknown as React.TouchEvent);
    });

    expect(result.current.state.isSwiping).toBe(true);
  });

  it("should track touch move", () => {
    const { result } = renderHook(() => useSwipe());

    act(() => {
      result.current.handlers.onTouchStart({
        touches: [{ clientX: 100, clientY: 50 }],
      } as unknown as React.TouchEvent);
    });

    act(() => {
      result.current.handlers.onTouchMove({
        touches: [{ clientX: 150, clientY: 50 }],
      } as unknown as React.TouchEvent);
    });

    expect(result.current.state.offsetX).toBe(50);
  });

  it("should trigger onSwipeLeft when swiping left past threshold", () => {
    const onSwipeLeft = vi.fn();
    const { result } = renderHook(() => useSwipe({ onSwipeLeft, threshold: 50 }));

    act(() => {
      result.current.handlers.onTouchStart({
        touches: [{ clientX: 200, clientY: 50 }],
      } as unknown as React.TouchEvent);
    });

    act(() => {
      result.current.handlers.onTouchMove({
        touches: [{ clientX: 100, clientY: 50 }],
      } as unknown as React.TouchEvent);
    });

    act(() => {
      result.current.handlers.onTouchEnd();
    });

    expect(onSwipeLeft).toHaveBeenCalled();
    expect(result.current.state.direction).toBe("left");
  });

  it("should trigger onSwipeRight when swiping right past threshold", () => {
    const onSwipeRight = vi.fn();
    const { result } = renderHook(() => useSwipe({ onSwipeRight, threshold: 50 }));

    act(() => {
      result.current.handlers.onTouchStart({
        touches: [{ clientX: 100, clientY: 50 }],
      } as unknown as React.TouchEvent);
    });

    act(() => {
      result.current.handlers.onTouchMove({
        touches: [{ clientX: 200, clientY: 50 }],
      } as unknown as React.TouchEvent);
    });

    act(() => {
      result.current.handlers.onTouchEnd();
    });

    expect(onSwipeRight).toHaveBeenCalled();
    expect(result.current.state.direction).toBe("right");
  });

  it("should not trigger swipe when below threshold", () => {
    const onSwipeLeft = vi.fn();
    const onSwipeRight = vi.fn();
    const { result } = renderHook(() => useSwipe({ onSwipeLeft, onSwipeRight, threshold: 50 }));

    act(() => {
      result.current.handlers.onTouchStart({
        touches: [{ clientX: 100, clientY: 50 }],
      } as unknown as React.TouchEvent);
    });

    act(() => {
      result.current.handlers.onTouchMove({
        touches: [{ clientX: 120, clientY: 50 }],
      } as unknown as React.TouchEvent);
    });

    act(() => {
      result.current.handlers.onTouchEnd();
    });

    expect(onSwipeLeft).not.toHaveBeenCalled();
    expect(onSwipeRight).not.toHaveBeenCalled();
    expect(result.current.state.direction).toBeNull();
  });

  it("should cancel swipe when vertical movement exceeds maxVertical", () => {
    const onSwipeLeft = vi.fn();
    const { result } = renderHook(() => useSwipe({ onSwipeLeft, maxVertical: 50 }));

    act(() => {
      result.current.handlers.onTouchStart({
        touches: [{ clientX: 200, clientY: 50 }],
      } as unknown as React.TouchEvent);
    });

    act(() => {
      result.current.handlers.onTouchMove({
        touches: [{ clientX: 100, clientY: 200 }],
      } as unknown as React.TouchEvent);
    });

    expect(result.current.state.isSwiping).toBe(false);
    expect(result.current.state.offsetX).toBe(0);
  });

  it("should not respond to touch events when disabled", () => {
    const onSwipeLeft = vi.fn();
    const { result } = renderHook(() => useSwipe({ onSwipeLeft, disabled: true }));

    act(() => {
      result.current.handlers.onTouchStart({
        touches: [{ clientX: 200, clientY: 50 }],
      } as unknown as React.TouchEvent);
    });

    expect(result.current.state.isSwiping).toBe(false);
  });

  it("should reset state when reset is called", () => {
    const { result } = renderHook(() => useSwipe());

    act(() => {
      result.current.handlers.onTouchStart({
        touches: [{ clientX: 100, clientY: 50 }],
      } as unknown as React.TouchEvent);
    });

    act(() => {
      result.current.handlers.onTouchMove({
        touches: [{ clientX: 150, clientY: 50 }],
      } as unknown as React.TouchEvent);
    });

    act(() => {
      result.current.reset();
    });

    expect(result.current.state).toEqual({
      offsetX: 0,
      isSwiping: false,
      direction: null,
    });
  });

  it("should handle missing touch data gracefully", () => {
    const { result } = renderHook(() => useSwipe());

    act(() => {
      result.current.handlers.onTouchStart({
        touches: [],
      } as unknown as React.TouchEvent);
    });

    expect(result.current.state.isSwiping).toBe(false);

    act(() => {
      result.current.handlers.onTouchMove({
        touches: [],
      } as unknown as React.TouchEvent);
    });

    expect(result.current.state.offsetX).toBe(0);
  });
});
