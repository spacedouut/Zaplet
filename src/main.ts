import './style.css'

import { loadKernel } from './kernelLoader';

loadKernel().then((kernel) => {
  console.log(kernel.add(1, 2));
});