import ResetPasswordForm from "./_component/ResetPasswordForm";

const ResetPassword = () => {
  return (
    <>
      <div className="text-primary text-xl font-bold text-center">
        Chào mừng đến với E-com
      </div>
      <div className="text-dark-200 text-xm text-center my-2">
        Thay đổi mật khẩu
      </div>

      <ResetPasswordForm />
    </>
  );
};

export default ResetPassword;
