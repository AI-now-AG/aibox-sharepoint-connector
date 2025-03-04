<script lang="ts">
  import { onMount } from "svelte";
  import { TextSelection } from "prosemirror-state";
  import { Tipex, type TipexEditor } from "@friendofsvelte/tipex";
  import "@friendofsvelte/tipex/styles/Tipex.css";
  import "@friendofsvelte/tipex/styles/ProseMirror.css";
  import "@friendofsvelte/tipex/styles/Controls.css";
  import "@friendofsvelte/tipex/styles/EditLink.css";
  import "@friendofsvelte/tipex/styles/CodeBlock.css";

  let editor: TipexEditor | undefined = $state();

  interface Props {
    initContent?: string;
    html?: string;
    text?: string;
  }

  let {
    initContent,
    html = $bindable(""),
    text = $bindable(""),
  }: Props = $props();

  let body = $state(initContent);

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

  onMount(() => {});
</script>

<Tipex
  bind:tipex={editor}
  {body}
  controls
  floating
  class="h-[46vh] border border-neutral-200"
  oncreate={(e) => {
    setFocusAtTheEnd(e.editor);
  }}
  onupdate={(e) => {
    onEditorUpdate(e);
  }}
  focused={false}
>
  {#snippet utilities(_tipex)}
    <div></div>
  {/snippet}
</Tipex>
