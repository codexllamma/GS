"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/router";
import AuthForm from "./authForm";
import { useAuthModal } from "@/store/useAuthModal";
import { handlePostLogin } from "@/lib/handlePostLogin";

const AuthModal = () => {
  const { isOpen, close } = useAuthModal();
  const router = useRouter();

  const onSuccess = async () => {
    close();
    await handlePostLogin(router);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[100] bg-black/40 flex items-center justify-center"
          onClick={close}
        >
          <motion.div
            className="bg-white rounded-2xl p-6 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <AuthForm onSuccess={onSuccess} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AuthModal;
