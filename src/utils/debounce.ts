function debounce<T extends (...args: any[]) => any>(func: T, delay: number): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null;

  return function(this: ThisParameterType<T>, ...args: Parameters<T>) {
    const context = this;
    const later = () => {
      timeout = null;
      func.apply(context, args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, delay);
  };
}

export default debounce;
