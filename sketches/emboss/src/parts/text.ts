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

/** Plane size per pixel of the wanted mark width, measured at rest (front layer + relief). */
const FIT_LG = 3.95;
const FIT_XS = 3.68;

export class Text extends MyObject3D {

  private _mesh: Mesh;
  private _scale: number = 1;
  private _noise: Vector2 = new Vector2(Util.instance.range(1), Util.instance.range(1));

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
        }
      })
    )
    this.add(this._mesh);
    this._mesh.renderOrder = Conf.instance.TEXT_NUM - this._noise.x;
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
    let s = (xs ? 0.862 * FIT_XS : 0.403 * FIT_LG) * sw;
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
    uni.time.value += 0.1;
    uni.bp.value.set(
      Util.instance.map(mx, 0, 1, -1, 1),
      Util.instance.map(my * -1, 0, 1, -1, 1)
    )
  }
}