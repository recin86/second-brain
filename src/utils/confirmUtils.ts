export const confirmDelete = (message: string): boolean => {
  return window.confirm(message);
};

export const createDeleteHandler = (
  itemId: string,
  confirmMessage: string,
  deleteFunction: (id: string) => void | Promise<void>
) => {
  return async () => {
    if (confirmDelete(confirmMessage)) {
      await deleteFunction(itemId);
    }
  };
};