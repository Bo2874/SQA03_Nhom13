import { ReactNode } from "react";
import { createPortal } from "react-dom";

interface PortalProps {
  children: ReactNode;
}

const Portal = ({ children }: PortalProps) => {
  const container = document.getElementById("portal");

  return container ? createPortal(children, container) : null;
};

export default Portal;
