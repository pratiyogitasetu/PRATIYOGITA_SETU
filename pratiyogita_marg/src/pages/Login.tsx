import { useNavigate } from 'react-router-dom';
import AuthModal from '@/components/AuthModal';

const Login = () => {
  const navigate = useNavigate();

  return (
    <AuthModal
      isOpen={true}
      onClose={() => navigate('/')}
      initialMode="login"
    />
  );
};

export default Login;
