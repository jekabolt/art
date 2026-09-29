import { Util } from '../libs/util';

export class Conf {
  private static _instance: Conf;

  public IS_BUILD:boolean = false;

  public FLG_PARAM: boolean          = this.IS_BUILD ? false : false;
  public FLG_LOW_FPS: boolean        = this.IS_BUILD ? false : false;
  public FLG_DEBUG_TXT: boolean      = this.IS_BUILD ? false : false;
  public FLG_STATS: boolean          = this.IS_BUILD ? false : false;

  public PATH_IMG: string = import.meta.env.BASE_URL + 'assets/img/';

  public USE_TOUCH: boolean = Util.instance.isTouchDevice();

  public BREAKPOINT: number = 768;

  public LG_PSD_WIDTH: number = 1600;
  public XS_PSD_WIDTH: number = 750;

  public IS_SIMPLE: boolean = Util.instance.isPc() && Util.instance.isSafari();

  public IS_PC: boolean = Util.instance.isPc();
  public IS_SP: boolean = Util.instance.isSp();
  public IS_AND: boolean = Util.instance.isAod();
  public IS_TAB: boolean = Util.instance.isIPad();
  public USE_ROLLOVER:boolean = Util.instance.isPc() && !Util.instance.isIPad()

  public TEXT_NUM: number = 100;

  constructor() {}
  public static get instance(): Conf {
    if (!this._instance) {
      this._instance = new Conf();
    }
    return this._instance;
  }
}
