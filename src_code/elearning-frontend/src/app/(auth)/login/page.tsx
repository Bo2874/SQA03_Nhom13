import LoginForm from "./_component/LoginForm";

const Login = () => {
  return (
    <>
      <div className="text-primary text-xl font-bold text-center">
        Chào mừng đến với Elearning
      </div>
      <div className="text-dark-200 text-center my-2">Đăng nhập</div>

      <LoginForm />
    </>
  );
};

export default Login;
