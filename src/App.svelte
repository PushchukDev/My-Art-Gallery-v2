<script lang="ts">
  import { onMount } from 'svelte';
  import Loader from '$lib/components/Loader.svelte';
  import PresetPicker from '$lib/components/PresetPicker.svelte';
  import ProcessVideo from '$lib/components/ProcessVideo.svelte';
  import ResetButton from '$lib/components/ResetButton.svelte';
  import AudioBackdrop from '$lib/components/AudioBackdrop.svelte';
  import AssetsNotice from '$lib/components/AssetsNotice.svelte';
  import Tunnel from '$lib/components/modes/Tunnel.svelte';
  import Drift from '$lib/components/modes/Drift.svelte';
  import Film from '$lib/components/modes/Film.svelte';
  import Gallery from '$lib/components/modes/Gallery.svelte';
  import {
    loadPreset,
    savePreset,
    type ExplorePreset,
  } from '$lib/data/presets';

  type ModeApi = { resetToStart: () => void };

  let ready = $state(false);
  let reducedMotion = $state(false);
  let preset = $state<ExplorePreset>('tunnel');
  let processOpen = $state(false);
  let hideChrome = $state(false);
  let tipOpen = $state(false);
  let modeApi = $state<ModeApi | null>(null);

  /** Reduced motion → Drift (no Z tunnel / 3D film). Gallery stays available. */
  const activePreset = $derived(
    reducedMotion && (preset === 'tunnel' || preset === 'film') ? 'drift' : preset,
  );

  const disabledIds = $derived<ExplorePreset[]>(
    reducedMotion ? ['tunnel', 'film'] : [],
  );

  onMount(() => {
    reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    preset = loadPreset();
    if (reducedMotion) {
      preset = 'drift';
    }

    const reveal = () => {
      ready = true;
    };

    if (document.readyState === 'complete') {
      requestAnimationFrame(reveal);
    } else {
      window.addEventListener('load', reveal, { once: true });
    }
  });

  $effect(() => {
    const mode = processOpen ? 'process' : activePreset;
    document.body.dataset.explore = mode;
    document.documentElement.dataset.explore = mode;
    document.body.dataset.lit = processOpen ? 'true' : 'false';

    if (processOpen) return;

    const readProgress = () => {
      if (mode === 'film') {
        return Number(document.body.dataset.filmProgress ?? 0);
      }
      return window.scrollY || document.documentElement.scrollTop;
    };

    const syncLit = () => {
      document.body.dataset.lit = readProgress() > 36 ? 'true' : 'false';
    };

    syncLit();
    window.addEventListener('scroll', syncLit, { passive: true });
    window.addEventListener('film-progress', syncLit);

    return () => {
      window.removeEventListener('scroll', syncLit);
      window.removeEventListener('film-progress', syncLit);
    };
  });

  function setPreset(next: ExplorePreset) {
    processOpen = false;
    hideChrome = false;
    modeApi = null;
    preset = next;
    savePreset(next);
    document.body.dataset.lit = 'false';
    delete document.body.dataset.filmProgress;
    window.scrollTo(0, 0);
  }

  function toggleProcess() {
    processOpen = !processOpen;
    hideChrome = false;
    if (processOpen) {
      document.body.dataset.lit = 'true';
      window.scrollTo(0, 0);
    }
  }

  function resetActiveMode() {
    if (processOpen) {
      processOpen = false;
      return;
    }
    hideChrome = false;
    modeApi?.resetToStart();
  }
</script>

<Loader visible={!ready} />

{#if ready}
  <AssetsNotice />
  <AudioBackdrop />

  {#if processOpen}
    <ProcessVideo />
  {:else}
    {#key activePreset}
      {#if activePreset === 'tunnel'}
        <Tunnel bind:this={modeApi} />
      {:else if activePreset === 'film'}
        <Film bind:this={modeApi} />
      {:else if activePreset === 'gallery'}
        <Gallery bind:this={modeApi} onzoomchange={(open) => (hideChrome = open)} />
      {:else}
        <Drift bind:this={modeApi} />
      {/if}
    {/key}
  {/if}

  <ResetButton faded={hideChrome || tipOpen} onclick={resetActiveMode} />

  <PresetPicker
    value={activePreset}
    disabledIds={disabledIds}
    processActive={processOpen}
    forceMute={processOpen}
    faded={hideChrome}
    onchange={setPreset}
    onprocesstoggle={toggleProcess}
    ontipchange={(visible) => (tipOpen = visible)}
  />
{/if}

<style>
  /* Only lock body scroll — leave html gutter so the chrome doesn't jump */
  :global(body[data-explore='film']),
  :global(body[data-explore='process']) {
    overflow: hidden;
    height: 100%;
  }
</style>
