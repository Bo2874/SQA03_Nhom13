import VerifyEmailForm from "./_component/VerifyEmailForm";

const ForgotPassword = () => {
  return (
    <>
      <div className="text-primary text-xl font-bold text-center">
        Xác thực tài khoản
      </div>

      <VerifyEmailForm />
    </>
  );
};

export default ForgotPassword;
