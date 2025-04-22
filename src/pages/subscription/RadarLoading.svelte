<script lang="ts">
</script>

<div class="w-[40px] h-[40px] relative">
  <div class="circle"></div>
  <div class="circle2"></div>
  <div class="circle3"></div>
  <div class="circle4"></div>
</div>

<style>
  .circle {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: #2196f3;
    position: absolute;
    -webkit-animation-timing-function: linear;
    -webkit-animation: scaler 4s infinite; /* Chrome, Safari, Opera */
    -webkit-animation-timing-function: linear; /* Chrome, Safari, Opera */
    animation: scaler 4s infinite;
    animation-timing-function: linear;
  }

  .circle2 {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: #2196f3;
    position: absolute;
    -webkit-animation-timing-function: linear;
    -webkit-animation: scaler 4s infinite; /* Chrome, Safari, Opera */
    -webkit-animation-timing-function: linear; /* Chrome, Safari, Opera */
    animation: scaler 4s infinite;
    animation-timing-function: linear;
    -webkit-animation-delay: 1s;
    animation-delay: 1s;
  }

  .circle3 {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: #2196f3;
    position: absolute;
    -webkit-animation-timing-function: linear;
    -webkit-animation: scaler 4s infinite; /* Chrome, Safari, Opera */
    -webkit-animation-timing-function: linear; /* Chrome, Safari, Opera */
    animation: scaler 4s infinite;
    animation-timing-function: linear;
    -webkit-animation-delay: 2s;
    animation-delay: 2s;
  }

  .circle4 {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: #2196f3;
    position: absolute;
    -webkit-animation-timing-function: linear;
    -webkit-animation: scaler 4s infinite; /* Chrome, Safari, Opera */
    -moz-animation: scaler 4s infinite; /* Chrome, Safari, Opera */
    animation: scaler 4s infinite; /* Chrome, Safari, Opera */
    -webkit-animation-timing-function: linear; /* Chrome, Safari, Opera */
    animation: scaler 4s infinite;
    animation-timing-function: linear;
    -webkit-animation-delay: 3s;
    animation-delay: 3s;
  }

  @-webkit-keyframes scaler {
    0% {
      -webkit-transform: scale(1);
    }

    33% {
      -webkit-transform: scale(2);
      opacity: 0.2;
    }

    67% {
      -webkit-transform: scale(3);
      opacity: 0.1;
    }

    100% {
      -webkit-transform: scale(4);
      opacity: 0;
    }
  }

  @keyframes scaler {
    0% {
      transform: scale(1);
    }

    33% {
      transform: scale(2);
      opacity: 0.2;
    }

    67% {
      transform: scale(3);
      opacity: 0.1;
    }

    100% {
      transform: scale(4);
      opacity: 0;
    }
  }
</style>
