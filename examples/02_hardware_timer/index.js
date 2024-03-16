import { time_us_32 } from 'pico/hardware';

const usTime32 = time_us_32();
print(`Time in microseconds: ${usTime32}`);