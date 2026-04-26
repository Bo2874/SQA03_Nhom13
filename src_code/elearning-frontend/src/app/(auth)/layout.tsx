import { ReactNode } from "react";

const AuthLayout = ({
  children,
}: Readonly<{
  children: ReactNode;
}>) => {
  return (
    <div className="w-screen h-screen flex justify-center items-center">
      <div className="w-full max-w-[500px] shadow-2xl px-8 py-16 rounded-lg">
        {children}
      </div>
    </div>
  );
};

export default AuthLayout;
