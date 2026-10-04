import PasswordRecoveryView from '../Components/PasswordRecoveryView';

// Recovery stays unavailable until the backend verifies codes and updates passwords.
const EmailSentConfirmation = () => <PasswordRecoveryView />;
export default EmailSentConfirmation;
