import { Func } from '../core/func';
import { Canvas } from '../webgl/canvas';
import { Object3D } from 'three/src/core/Object3D';
import { Update } from '../libs/update';
import { Text } from './text';
import { Util } from '../libs/util';
import { Color } from 'three/src/math/Color';
import { Conf } from '../core/conf';
import { HSL } from '../libs/hsl';
import { MousePointer } from '../core/mousePointer';
import { listenTaps } from '../core/tap';
import { Raycaster } from 'three/src/core/Raycaster';
import { Plane } from 'three/src/math/Plane';
import { Vector2 } from 'three/src/math/Vector2';
import { Vector3 } from 'three/src/math/Vector3';

/** /emboss-black: black logo on white; /emboss-white (and the old /emboss): white on black. */
const isBlack = (): boolean => /^\/emboss-black(\/|$)/.test(window.location.pathname);

export class Visual extends Canvas {

  private _con: Object3D;
  private _texts: Text[] = [];

  constructor(opt: any) {
    super(opt);

    this._con = new Object3D();
    this.mainScene.add(this._con);

    // page and canvas behind the first frame match the tone (style.css is black)
    if (isBlack()) document.body.classList.add('-black');

    // this._con.rotation.x = Util.instance.radian(45);
    // this._con.rotation.z = Util.instance.radian(-45);

    const num = Conf.instance.TEXT_NUM;
    for (let i = 0; i < num; i++) {
      const col = new Color(0xffffff);
      const hsl = new HSL();
      col.getHSL(hsl);
      hsl.h = Util.instance.map(i, 0, 1, 0, num - 1);
      // white: front layer white fading to grey behind; black: front layer black lightening behind
      hsl.l = isBlack() ? Util.instance.map(i, 0, 0.75, 0, num - 1) : Util.instance.map(i, 1, 0.25, 0, num - 1);
      col.setHSL(hsl.h, hsl.s, hsl.l);

      const text = new Text({
        id: i,
        color: col,
        useMask: true,
        // scale: Util.instance.random(1, 1.2),
        scale: Util.instance.map(i, 0.5, 1, 0, num - 1),
      });
      this._texts.push(text);
      this._con.add(text);
    }

    // The tap lands on the front layer's plane (z = 0): the effects are placed in world units.
    const ray = new Raycaster();
    const front = new Plane(new Vector3(0, 0, 1), 0);
    const hit = new Vector3();
    listenTaps((x, y) => {
      const ndc = new Vector2((x / Func.instance.sw()) * 2 - 1, -(y / Func.instance.sh()) * 2 + 1);
      ray.setFromCamera(ndc, this.cameraPers);
      if (!ray.ray.intersectPlane(front, hit)) return;
      for (const t of this._texts) t.onTap(hit);
    });

    this._resize();
  }


  protected _update(): void {
    super._update();

    const mx = MousePointer.instance.easeNormal.x;
    const my = MousePointer.instance.easeNormal.y;
    this._con.rotation.y = Util.instance.radian(mx * -10);
    this._con.rotation.x = Util.instance.radian(my * -10);

    if (this.isNowRenderFrame()) {
      this._render()
    }
  }


  private _render(): void {
    this.renderer.setClearColor(isBlack() ? 0xffffff : 0x000000, 1);
    this.renderer.render(this.mainScene, this.cameraPers);
  }


  public isNowRenderFrame(): boolean {
    return this.isRender && Update.instance.cnt % 1 == 0
  }


  _resize(): void {
    super._resize();

    const w = Func.instance.sw();
    const h = Func.instance.sh();

    this.renderSize.width = w;
    this.renderSize.height = h;

    this._updateOrthCamera(this.cameraOrth, w, h);

    this.cameraPers.fov = 70;
    this._updatePersCamera(this.cameraPers, w, h);

    let pixelRatio: number = window.devicePixelRatio || 1;

    this.renderer.setPixelRatio(pixelRatio);
    this.renderer.setSize(w, h);
    this.renderer.clear();
  }
}
