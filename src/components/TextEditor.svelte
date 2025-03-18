<script lang="ts">
  import { onMount } from "svelte";
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
  }

  let {
    html = $bindable(""),
    text = $bindable(""),
    cssClass = "",
  }: Props = $props();

  let body: any = $state("");

  $effect(() => {
    body = html;
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

  onMount(() => {});
</script>

{#key body}
  <Tipex
    bind:tipex={editor}
    {body}
    controls
    floating
    class={"h-[46vh] border border-neutral resize-y " + cssClass}
    style="transition-duration: 0ms !important;"
    oncreate={(e: any) => {
      setFocusAtTheEnd(e.editor);
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
