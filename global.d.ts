declare namespace JSX {
  type IntrinsicElements = object;
}

declare namespace svelteHTML {
  /* eslint-disable @typescript-eslint/no-unused-vars */
  interface HTMLAttributes<T> {
    onfilesdropped?: (e: CustomEvent<unknown>) => void;
    onfilesrejected?: (e: CustomEvent<unknown>) => void;
  }
}