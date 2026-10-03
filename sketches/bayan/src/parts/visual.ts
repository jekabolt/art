import vt from '../glsl/hokan.vert';
import fg from '../glsl/hokan.frag';
import { Func } from '../core/func';
import { Canvas } from '../webgl/canvas';
import { Object3D } from 'three/src/core/Object3D';
import { BaseItem } from './baseItem';
import { TexLoader } from '../webgl/texLoader';
import { Mesh, PlaneGeometry, ShaderMaterial, SplineCurve, Vector2 } from 'three';
import { Util } from '../libs/util';
import { Param } from '../core/param';
import { MousePointer } from '../core/mousePointer';
import { Conf } from '../core/conf';
import { haptic, hapticWhileDragging } from '../core/haptic';

/** Folds of the bellows in a full stretch: on Android each one clicks under the finger. */
const FOLDS = 12;


export class Visual extends Canvas {

  private _con:Object3D
  private _left: BaseItem
  private _right: BaseItem
  private _hokan: Array<Mesh> = []
  private _fold = -1
  private _stretch = 0

  constructor(opt: any) {
    super(opt);

    this._con = new Object3D();
    this.mainScene.add(this._con);

    const t = TexLoader.instance.get(Conf.instance.PATH_IMG + 'logo.jpg');

    this._left = new BaseItem(new Vector2(0.5, 1), t);
    this._con.add(this._left);

    this._right = new BaseItem(new Vector2(0, 0.5), t);
    this._con.add(this._right);

    const geo = new PlaneGeometry(1, 0.01)
    const mat = new ShaderMaterial({
      vertexShader:vt,
      fragmentShader:fg,
      transparent: true,
      depthTest: false,
      uniforms: {
        t: { value: t },
      },
    })
    const num = 100
    for(let i = 0; i < num; i++) {
      const hokan = new Mesh(geo, mat)
      this._con.add(hokan)
      this._hokan.push(hokan)
    }

    // The bellows under the finger: a tick as it lands and as it lets go (an iPhone allows nothing in
    // between), and on letting go of a well-stretched bellows a short breath out (Android).
    window.addEventListener('pointerdown', () => haptic(8))
    window.addEventListener('pointerup', () => haptic(this._stretch > 0.5 ? [14, 40, 10, 40, 6] : 8))

    console.log(Param.instance.fps)
    this._resize();
  }


  protected _update(): void {
    super._update();

    const sw = this.renderSize.width;
    const sh = this.renderSize.height;
    const size = Math.max(sw, sh) * 0.25

    const mx = MousePointer.instance.easeNormal.x
    const my = MousePointer.instance.easeNormal.y

    this._left.scale.set(size, size, 1)
    // this._left.position.y = Util.map(Math.abs(my), sh * 0.01, sh * 0.5, 0, 1)
    this._left.position.y = my * sh * 0.25 + Math.sin(this._c * -0.013) * sw * 0.01
    this._left.position.x = mx * sw * -0.25 + Math.sin(this._c * 0.01) * sw * 0.01

    this._right.scale.set(size, size, 1)
    this._right.position.y = this._left.position.y * -1
    this._right.position.x = this._left.position.x * -1

    // a click for every fold the bellows opens or closes while the finger drags it
    this._stretch = Math.min(1, Math.sqrt(mx * mx + my * my))
    const fold = Math.floor(this._stretch * FOLDS)
    if (MousePointer.instance.isDown && this._fold >= 0 && fold !== this._fold) hapticWhileDragging(6)
    this._fold = fold

    const offset = Util.map(Math.sqrt(mx * mx + my * my), 0, 1, 0.3, 0.5)
    const center = new Vector2(mx * sw * -0.1 * offset, my * sw * -0.01 * offset)

    const curve = new SplineCurve([
      new Vector2(this._left.position.x, this._left.position.y),
      center,
      new Vector2(this._right.position.x, this._right.position.y)
    ])
    const points = curve.getPoints(this._hokan.length - 1)

    this._hokan.forEach((hokan, i) => {
      hokan.scale.set(size, size, 1)

      const p = points[i]
      if(p != undefined) {
        hokan.position.x = p.x
        hokan.position.y = p.y

        if(i != this._hokan.length - 1){
          const next = points[i + 1]
          const dx = next.x - p.x
          const dy = next.y - p.y
          hokan.rotation.z = Util.radian(Util.degree(Math.atan2(dy, dx)) + 90)

          if(i === 0) this._left.rotation.z = hokan.rotation.z
          if(i === this._hokan.length - 2) this._right.rotation.z = hokan.rotation.z
        } else {
          hokan.visible = false
        }
      }
    })

    if (this.isNowRenderFrame()) {
      this._render()
    }
  }


  private _render(): void {
    this.renderer.setClearColor(0xffffff, 1);
    this.renderer.render(this.mainScene, this.cameraOrth);
  }


  public isNowRenderFrame(): boolean {
    return this.isRender
  }


  _resize(): void {
    super._resize();

    const w = Func.sw();
    const h = Func.sh();

    this.renderSize.width = w;
    this.renderSize.height = h;

    this._updateOrthCamera(this.cameraOrth, w, h);

    this.cameraPers.fov = 80;
    this._updatePersCamera(this.cameraPers, w, h);

    let pixelRatio: number = window.devicePixelRatio || 1;
    this.renderer.setPixelRatio(pixelRatio);
    this.renderer.setSize(w, h);
    this.renderer.clear();
  }
}
