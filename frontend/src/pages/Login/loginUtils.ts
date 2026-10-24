export function getFriendlyErrorMessage(err: any): string {
  const code = err.code || '';
  if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
    return 'E-mail ou senha incorretos. Por favor, verifique suas credenciais.';
  }
  if (code === 'auth/email-already-in-use') {
    return 'Este e-mail já está cadastrado. Tente entrar ou redefinir sua senha.';
  }
  if (code === 'auth/weak-password') {
    return 'A senha deve ter no mínimo 6 caracteres.';
  }
  if (code === 'auth/too-many-requests') {
    return 'Muitas tentativas malsucedidas. Aguarde alguns instantes antes de tentar novamente.';
  }
  if (code === 'auth/invalid-email') {
    return 'Endereço de e-mail inválido.';
  }
  if (code === 'auth/operation-not-allowed') {
    return 'O provedor Google precisa ser ativado no Firebase Console (Acesse: Authentication > Sign-in method > Google e clique em Ativar).';
  }
  return err.message || 'Ocorreu um erro ao processar. Tente novamente.';
}
