import { gpio_init, gpio_set_dir, gpio_put } from 'pico/hardware';

const led_pin = 13;
const GPIO_OUT = true;

gpio_init(led_pin);
gpio_set_dir(led_pin, GPIO_OUT);

while (true) {
    gpio_put(led_pin, 1);
    sleep_ms(250);
    gpio_put(led_pin, 0);
    sleep_ms(250);
}