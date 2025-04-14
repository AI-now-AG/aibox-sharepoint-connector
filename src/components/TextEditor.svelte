<script lang="ts">
  import { TextSelection } from "prosemirror-state";
  import { Tipex, type TipexEditor } from "@friendofsvelte/tipex";
  import "@friendofsvelte/tipex/styles/Tipex.css";
  import "@friendofsvelte/tipex/styles/ProseMirror.css";
  import "@friendofsvelte/tipex/styles/Controls.css";
  import "@friendofsvelte/tipex/styles/EditLink.css";
  import "@friendofsvelte/tipex/styles/CodeBlock.css";
  import "$styles/editor.css";

  let editor: TipexEditor | undefined = $state();

  interface Props {
    html?: string;
    text?: string;
    cssClass?: string;
    blur?: Function;
    autoInitHeight?: boolean;
  }

  let {
    html = $bindable(""),
    text = $bindable(""),
    cssClass = "",
    blur,
    autoInitHeight,
  }: Props = $props();

  let body: any = $state("");
  let autoHeightStyle: any = $state("");

  $effect(() => {
    if (body === undefined || body === "") {
      body = html;
      blur?.();
    }
  });

  function onEditorUpdate(e: any) {
    html = e.editor.getHTML();
    text = e.editor.getText();
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
