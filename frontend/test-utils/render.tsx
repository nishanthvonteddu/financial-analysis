import { render } from "@testing-library/react";
import type { RenderOptions } from "@testing-library/react";
import type { ReactElement } from "react";

import { AppProviders } from "@/components/providers/app-providers";

const customRender = (ui: ReactElement, options?: Omit<RenderOptions, "wrapper">) =>
  render(ui, {
    wrapper: ({ children }) => <AppProviders>{children}</AppProviders>,
    ...options,
  });

export * from "@testing-library/react";
export { customRender as render };
