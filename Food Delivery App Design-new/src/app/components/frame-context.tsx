import { createContext, useContext } from "react";

/**
 * The phone frame element. Overlays (sheets, toasts) portal into it so they
 * anchor to the device, not the browser window, on desktop.
 */
export const FrameContext = createContext<HTMLElement | null>(null);

export const useFrame = () => useContext(FrameContext);
