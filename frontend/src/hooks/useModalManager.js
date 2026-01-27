import { useState, useCallback, useMemo } from "react";

/**
 * Custom hook for managing multiple modal states
 * Simplifies handling of multiple modals in a component
 *
 * @param {string[]} modalNames - Array of modal identifiers
 *
 * @example
 * const { modals, openModal, closeModal, toggleModal, closeAll } = useModalManager([
 *   'invite',
 *   'edit',
 *   'proposedTimes',
 *   'finalize'
 * ]);
 *
 * // In JSX:
 * <InviteModal isOpen={modals.invite} onClose={() => closeModal('invite')} />
 * <EditModal isOpen={modals.edit} onClose={() => closeModal('edit')} />
 *
 * // To open:
 * <Button onClick={() => openModal('invite')}>Invite</Button>
 */
export const useModalManager = (modalNames = []) => {
  // Memoize modal names to prevent unnecessary re-renders
  const stableModalNames = useMemo(() => modalNames, [modalNames.join(',')]);

  // Initialize state with all modals closed
  const [modals, setModals] = useState(() =>
    stableModalNames.reduce((acc, name) => {
      acc[name] = false;
      return acc;
    }, {})
  );

  const openModal = useCallback((name) => {
    setModals((prev) => ({
      ...prev,
      [name]: true
    }));
  }, []);

  const closeModal = useCallback((name) => {
    setModals((prev) => ({
      ...prev,
      [name]: false
    }));
  }, []);

  const toggleModal = useCallback((name) => {
    setModals((prev) => ({
      ...prev,
      [name]: !prev[name]
    }));
  }, []);

  const closeAll = useCallback(() => {
    setModals(stableModalNames.reduce((acc, name) => ({ ...acc, [name]: false }), {}));
  }, [stableModalNames]);

  /**
   * Check if any modal is currently open
   */
  const isAnyOpen = useMemo(() => Object.values(modals).some(Boolean), [modals]);

  /**
   * Get the name of the currently open modal (first one found)
   */
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
    activeModal
  };
};

export default useModalManager;
