import '../styles/style.scss';
import picturefill from 'picturefill';
picturefill();
import WebGL from './components/webgl';

export default class App {
    constructor() {
        window.addEventListener(
            'DOMContentLoaded',
            () => {
                this.init();
            },
            false
        );
    }
    init() {
        new WebGL();
    }
}
new App();
