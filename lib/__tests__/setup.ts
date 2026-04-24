import "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import * as React from "react";

// Fix React 19 compatibility with @testing-library/react
// React 19 moved `act` to `react` package instead of `react-dom/test-utils`
(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

// Mock react-dom/test-utils to use React.act from the react package
vi.mock("react-dom/test-utils", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...(actual as object),
    act: React.act,
  };
});

afterEach(() => {
  cleanup();
});
