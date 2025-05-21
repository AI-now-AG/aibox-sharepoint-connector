<script lang="ts">
  import { TextSelection } from "prosemirror-state";
  import { Tipex, type TipexEditor } from "@friendofsvelte/tipex";
  import "@friendofsvelte/tipex/styles/Tipex.css";
  import "@friendofsvelte/tipex/styles/ProseMirror.css";
  import "@friendofsvelte/tipex/styles/Controls.css";
  import "@friendofsvelte/tipex/styles/EditLink.css";
  import "@friendofsvelte/tipex/styles/CodeBlock.css";
  import "$styles/editor.css";

  let editor: TipexEditor | undefined;

  interface Props {
    html?: string;
    cssClass?: string;
    oncreate?: Function;
    autoInitHeight?: boolean;
  }

  let {
    html = $bindable(""),
    cssClass = "",
    oncreate,
    autoInitHeight,
  }: Props = $props();

  let body: string = $state("");
  let autoHeightStyle: string = $state("");

  $effect(() => {
    // reset (for reinitialize)
    if (html === "") {
      body = "";
    }
    // set initial body from property
    if (body === "" && html !== "") {
      body = html;
    }
  });

  function onEditorUpdate(e: any) {
    html = e.editor.getHTML();
  }

  function setFocusAtTheEnd(_editor: TipexEditor) {
    if (_editor) {
      const view = _editor.view;
      const transaction = view.state.tr.setSelection(
        TextSelection.create(view.state.doc, view.state.doc.content.size),
      );
      view?.dispatch(transaction);
      view?.focus();
    }
  }

  function setHeightBasedOnContent(_editor: TipexEditor) {
    if (_editor && autoInitHeight) {
      const elements = document.querySelectorAll(".tiptap.ProseMirror");
      elements.forEach((el, index) => {
        if (index == 0)
          autoHeightStyle = `height: ${(el as HTMLElement).scrollHeight + 80}px !important;`;
      });
    }
  }
</script>

{#key body}
  <Tipex
    bind:tipex={editor}
    {body}
    controls
    floating
    class={"h-[46vh] min-h-[200px] border border-neutral resize-y " + cssClass}
    style={"transition-duration: 0ms !important; " + autoHeightStyle}
    oncreate={(e: any) => {
      oncreate?.();
      setFocusAtTheEnd(e.editor);
      setHeightBasedOnContent(e.editor);
    }}
    onupdate={(e: any) => {
      onEditorUpdate(e);
    }}
    focal={true}
  >
    {#snippet utilities(_tipex: any)}
      <div></div>
    {/snippet}
  </Tipex>
{/key}
