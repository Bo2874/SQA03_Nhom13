import ForgotPasswordForm from "./_component/ForgotPasswordForm";

const ForgotPassword = () => {
  return (
    <>
      <div className="text-primary text-xl font-bold text-center">
        Chào mừng đến với E-com
      </div>
      <div className="text-dark-200 text-xm text-center my-2">
        Quên mật khẩu
      </div>

      <ForgotPasswordForm />
    </>
  );
};

export default ForgotPassword;
