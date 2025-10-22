/**
 * SVG icon components for use in the sample browser
 */

export const FolderIcon = () => (
  <svg
    class="w-4 h-4 mr-2"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="2"
      d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
    ></path>
  </svg>
);

export const ChevronRightIcon = (props: { class?: string }) => (
  <svg
    class={`w-4 h-4 mr-2 transition-transform ${props.class || ""}`}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="2"
      d="M9 5l7 7-7 7"
    ></path>
  </svg>
);

export const PlayIcon = (props: { class?: string }) => (
  <svg
    class={props.class || "w-5 h-5"}
    fill="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M8 5v14l11-7z"></path>
  </svg>
);

export const PauseIcon = (props: { class?: string }) => (
  <svg
    class={props.class || "w-5 h-5"}
    fill="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"></path>
  </svg>
);

export const PlusIcon = (props: { class?: string }) => (
  <svg
    class={props.class || "w-5 h-5"}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="3"
      d="M12 4v16m8-8H4"
    ></path>
  </svg>
);

export const MinusIcon = (props: { class?: string }) => (
  <svg
    class={props.class || "w-5 h-5"}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="3"
      d="M20 12H4"
    ></path>
  </svg>
);
