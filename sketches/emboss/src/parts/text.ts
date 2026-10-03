import vt from '../glsl/text.vert';
import fg from '../glsl/text.frag';
import { Mesh } from 'three/src/objects/Mesh';
import { Color } from 'three/src/math/Color';
import { Vector2 } from 'three/src/math/Vector2';
import { PlaneGeometry } from 'three/src/geometries/PlaneGeometry';
import { ShaderMaterial } from 'three/src/materials/ShaderMaterial';
import { MyObject3D } from "../webgl/myObject3D";
import { TexLoader } from '../webgl/texLoader';
import { Conf } from '../core/conf';
import { Func } from '../core/func';
import { MousePointer } from '../core/mousePointer';
import { Util } from '../libs/util';
import { Vector3 } from 'three/src/math/Vector3';
import { tapAge } from '../core/tap';

/** wave: how long one layer swells, and the lag from one layer to the next (front → back). */
const WAVE_DUR = 0.7;
const WAVE_LAG = 0.006;
/** glint: the ring's run time and how far it runs, in mark widths. */
const GLINT_DUR = 1.1;
const GLINT_REACH = 1.4;

/** Plane size per pixel of the wanted mark width, measured at rest (front layer + relief). */
const FIT_LG = 3.95;
const FIT_XS = 3.68;
/** Mark width on a phone, share of the screen width (a bit smaller than /logo-black's 0.862). */
const MARK_XS = 0.7;

export class Text extends MyObject3D {

  private _mesh: Mesh;
  private _scale: number = 1;
  private _noise: Vector2 = new Vector2(Util.instance.range(1), Util.instance.range(1));
  /** Where the last tap hit the front plane (world units). */
  private _tapAt: Vector3 = new Vector3();

  constructor(opt: {id: number, color: Color, useMask: boolean, scale: number}) {
    super();

    this._noise.x = opt.id;
    this._scale = opt.scale;

    const tex = TexLoader.instance.get(Conf.instance.PATH_IMG + 'tex-text.png');

    this._mesh = new Mesh(
      new PlaneGeometry(1, 1),
      new ShaderMaterial({
        vertexShader:vt,
        fragmentShader:fg,
        transparent:true,
        depthTest:false,
        uniforms:{
          useMask:{value:!opt.useMask},
          t:{value:tex},
          c:{value:opt.color},
          bp:{value:new Vector2(0.5, 0.5)},
          ma:{value:new Vector2(0, 0)},
          mb:{value:new Vector2(0.5, 1)},
          mc:{value:new Vector2(0.75, 0)},
          line:{value:Util.instance.map(this._noise.x, 0, 1, 0, Conf.instance.TEXT_NUM - 1)},
          time:{value:0},
          glintAt:{value:new Vector2(0, 0)},
          glintR:{value:0},
          glintW:{value:1},
          glintK:{value:0},
        }
      })
    )
    this.add(this._mesh);
    this._mesh.renderOrder = Conf.instance.TEXT_NUM - this._noise.x;
  }

  public onTap(at: Vector3): void {
    this._tapAt.copy(at);
  }

  public setMask(p1: Vector2, p2: Vector2, p3: Vector2):void {
    const uni = this._getUni(this._mesh);
    uni.ma.value.copy(p1);
    uni.mb.value.copy(p2);
    uni.mc.value.copy(p3);
  }

  protected _update():void {
    super._update();

    // Sized like the logo pages (/logo-black, /logo-white): the mark is 0.403 of the width on desktop
    // and 0.862 on a phone. FIT turns that into the stack's plane size (measured, see tmp probe bbox.mjs).
    const sw = Func.instance.sw();
    const xs = sw <= Conf.instance.BREAKPOINT;
    let s = (xs ? MARK_XS * FIT_XS : 0.403 * FIT_LG) * sw;
    s *= this._scale;

    this._mesh.scale.set(s, s, 1);

    const mx = MousePointer.instance.easeNormal.x;
    const my = MousePointer.instance.easeNormal.y;

    const center = new Vector2(
      0.5,
      0.5,
    );
    // const center = new Vector2(
    //   Util.instance.map(this._noise.x, 0, 1, 0, Conf.instance.TEXT_NUM - 1),
    //   Util.instance.map(this._noise.x, 0, 1, 0, Conf.instance.TEXT_NUM - 1),
    // );
    // const rangeA = 0.5 * Util.instance.map(this._noise.x, 0.1, 1, 0, Conf.instance.TEXT_NUM - 1);
    // const rangeB = 0.5 * Util.instance.map(this._noise.x, 0.1, 1, 0, Conf.instance.TEXT_NUM - 1);
    const rangeA = 0.25;
    const rangeB = 0.25;

    this.setMask(
      new Vector2(
        center.x + mx * rangeA,
        center.y + Util.instance.map(my, rangeB, -rangeB, -1, 1)
      ),
      new Vector2(
        center.x - 0.5 + mx * rangeA,
        center.y - 0.5 + Util.instance.map(my, 0, rangeB, -1, 1)
      ),
      new Vector2(
        center.x + 0.5 + mx * rangeA,
        center.y - 0.5 + Util.instance.map(my, rangeB, 0, -1, 1)
      ),
    );

    // The front layer (id 0) stays in the centre, like the logo pages; only the layers behind it
    // trail the pointer, so the relief grows behind the logo instead of the whole logo drifting.
    this.position.x = s * 1 * mx * 0.15 * Util.instance.map(this._noise.x, 0, 2, 0, Conf.instance.TEXT_NUM - 1);
    this.position.y = s * 1 * my * -0.15 * Util.instance.map(this._noise.x, 0, 2, 0, Conf.instance.TEXT_NUM - 1);
    this.position.z = Util.instance.map(this._noise.x, 0, -1, 0, Conf.instance.TEXT_NUM - 1) * s * 1.1;

    const uni = this._getUni(this._mesh);
    const markW = s / this._scale / (xs ? FIT_XS : FIT_LG);

    {
      // Each layer swells once, the front first and the back last, and is pushed away from the
      // finger by up to a fifth of the mark: the relief bulges out from where it was touched.
      const lt = tapAge() - this._noise.x * WAVE_LAG;
      if (lt > 0 && lt < WAVE_DUR) {
        const env = Math.sin((Math.PI * lt) / WAVE_DUR) * (1 - lt / WAVE_DUR * 0.5);
        const depth = this._noise.x / (Conf.instance.TEXT_NUM - 1);
        this._mesh.scale.multiplyScalar(1 + 0.12 * env);
        const dx = -this._tapAt.x;
        const dy = -this._tapAt.y;
        const len = Math.hypot(dx, dy) || 1;
        this.position.x += (dx / len) * markW * 0.18 * env * depth;
        this.position.y += (dy / len) * markW * 0.18 * env * depth;
      }
    }
    {
      // A ring of light runs out from the finger; deeper layers catch it a little later, so it
      // rolls over the bevels of the relief rather than sliding over a flat picture.
      const lt = tapAge() - this._noise.x * 0.002;
      const k = lt > 0 && lt < GLINT_DUR ? 1 - lt / GLINT_DUR : 0;
      uni.glintAt.value.set(this._tapAt.x, this._tapAt.y);
      uni.glintR.value = (lt / GLINT_DUR) * markW * GLINT_REACH * 2;
      uni.glintW.value = markW * 0.07;
      uni.glintK.value = k * k;
    }

    uni.time.value += 0.1;
    uni.bp.value.set(
      Util.instance.map(mx, 0, 1, -1, 1),
      Util.instance.map(my * -1, 0, 1, -1, 1)
    )
  }
}