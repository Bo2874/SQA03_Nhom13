import { cn } from "@/config/utils";
import { SVGProps } from "react";

interface IconProps extends SVGProps<SVGSVGElement> {
  name: string;
  className?: string;
}

const SvgIcon = ({ name, className, ...props }: IconProps) => (
  <svg className={cn(className)} {...props}>
    <use xlinkHref={`/sprites.svg?v=1.1#icon-${name}`} />
  </svg>
);

export default SvgIcon;
