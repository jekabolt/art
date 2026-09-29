import device from 'current-device';

export class Util {
  private static _instance: Util;

  private constructor() {}

  public static get instance(): Util {
    if (!this._instance) {
      this._instance = new Util();
    }

    
    return this._instance;
  }

  public static rdn(degree: number): number {
    return (degree * Math.PI) / 180;
  }
  random(min: number, max: number): number {
    return Math.random() * (max - min) + min;
  }

  random2(min: number, max: number): number {
    let r: number = Math.random() * (max - min) + min;
    if (this.hit(2)) {
      r *= -1;
    }
    return r;
  }

  randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

 
  hit(range: number = 0): boolean {
    if (range < 2) range = 2;
    return this.randomInt(0, range - 1) == 0;
  }

  randomArr(arr: Array<any>): any {
    return arr[this.randomInt(0, arr.length - 1)];
  }

  range(val: number): number {
    return this.random(-val, val);
  }

  
  clamp(val: number, min: number, max: number): number {
    return Math.min(max, Math.max(val, min));
  }

 
  map(num: number, toMin: number, toMax: number, fromMin: number, fromMax: number): number {
    if (num <= fromMin) return toMin;
    if (num >= fromMax) return toMax;

    const p = (toMax - toMin) / (fromMax - fromMin);
    return (num - fromMin) * p + toMin;
  }

 
  mix(x: number, y: number, a: number): number {
    return x * (1 - a) + y * a;
  }

  radian(degree: number): number {
    return (degree * Math.PI) / 180;
  }

  
  degree(radian: number): number {
    return (radian * 180) / Math.PI;
  }

  
  shuffle(arr: Array<any>): void {
    let i = arr.length;
    while (--i) {
      let j = Math.floor(Math.random() * (i + 1));
      if (i == j) continue;
      let k = arr[i];
      arr[i] = arr[j];
      arr[j] = k;
    }
  }

  
  replaceAll(val: string, org: string, dest: string): string {
    return val.split(org).join(dest);
  }


  sort(arr: Array<any>, para: string, desc: boolean = true): void {
    if (desc) {
      arr.sort((a: any, b: any) => {
        return b[para] - a[para];
      });
    } else {
      arr.sort((a: any, b: any) => {
        return a[para] - b[para];
      });
    }
  }

 
  distance(x1: number, y1: number, x2: number, y2: number): number {
    const dx = x1 - x2;
    const dy = y1 - y2;
    return Math.sqrt(dx * dx + dy * dy);
  }

 
  numStr(num: number, keta: number): string {
    let str = String(num);
    if (str.length >= keta) return str;

    const len = keta - str.length;
    let i = 0;
    while (i < len) {
      str = '0' + str;
      i++;
    }

    return str;
  }

  
  isIE(): boolean {
    const ua = window.navigator.userAgent.toLowerCase();
    return ua.indexOf('msie') != -1 || ua.indexOf('trident/7') != -1 || ua.indexOf('edge') != -1;
  }


  isIE2(): boolean {
    const ua = window.navigator.userAgent.toLowerCase();
    return ua.indexOf('msie') != -1 || ua.indexOf('trident/7') != -1;
  }

  
  isWin(): boolean {
    return window.navigator.platform.indexOf('Win') != -1;
  }

  isChrome(): boolean {
    return window.navigator.userAgent.toLowerCase().indexOf('chrome') != -1;
  }

  isFF(): boolean {
    return window.navigator.userAgent.toLowerCase().indexOf('firefox') != -1;
  }

  isSafari(): boolean {
    return window.navigator.userAgent.toLowerCase().indexOf('safari') != -1 && !this.isChrome();
  }

  useWebGL(): boolean {
    try {
      const c = document.createElement('canvas');
      const w: any = c.getContext('webgl') || c.getContext('experimental-webgl');
      return !!(window.WebGLRenderingContext && w && w.getShaderPrecisionFormat);
    } catch (e) {
      return false;
    }
  }


  getQuery(key: string): string {
    key = key.replace(/[€[]/, '€€€[').replace(/[€]]/, '€€€]');
    const regex = new RegExp('[€€?&]' + key + '=([^&//]*)');
    const qs = regex.exec(window.location.href);
    if (qs == null) {
      return '';
    } else {
      return qs[1];
    }
  }


  isTouchDevice(): boolean {
    const isTouch = !!('ontouchstart' in window || (navigator != undefined && navigator.maxTouchPoints > 0));
    return isTouch;
  }


  isPc(): boolean {
    return (device.mobile() == false)
  }

  
  isSp(): boolean {
    return device.mobile()
  }

  
  isAod(): boolean {
    return device.android();
  }

  
  isIPhone(): boolean {
    return device.iphone();
  }

  
  isIPad(): boolean {
    return device.tablet();
  }
}
