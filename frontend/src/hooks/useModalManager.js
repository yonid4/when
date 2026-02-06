import { useCallback, useMemo, useState } from "react";

function createClosedModalsState(names) {
  return names.reduce((acc, name) => {
    acc[name] = false;
    return acc;
  }, {});
}

export function useModalManager(modalNames = []) {
  const stableModalNames = useMemo(() => modalNames, [modalNames.join(",")]);

  const [modals, setModals] = useState(() => createClosedModalsState(stableModalNames));

  const openModal = useCallback((name) => {
    setModals((prev) => ({ ...prev, [name]: true }));
  }, []);

  const closeModal = useCallback((name) => {
    setModals((prev) => ({ ...prev, [name]: false }));
  }, []);

  const toggleModal = useCallback((name) => {
    setModals((prev) => ({ ...prev, [name]: !prev[name] }));
  }, []);

  const closeAll = useCallback(() => {
    setModals(createClosedModalsState(stableModalNames));
  }, [stableModalNames]);

  const isAnyOpen = useMemo(() => Object.values(modals).some(Boolean), [modals]);

  const activeModal = useMemo(
    () => Object.entries(modals).find(([, isOpen]) => isOpen)?.[0] || null,
    [modals]
  );

  return {
    modals,
    openModal,
    closeModal,
    toggleModal,
    closeAll,
    isAnyOpen,
    activeModal,
  };
}

export default useModalManager;
