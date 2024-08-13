class MonsterBossGhroth extends Monster {
     constructor(pos, world) {
        super(pos, world);
        
        // 射手特性
        this.rangeR = 100;  // 射击范围
        this.dirction = new Vector(1, 2).to1();  // 朝向
        this.getmMainBullyFunc = BullyFinally.S;  // 发射的子弹类型
        this.bullySpeed = 8;  // 子弹速度
        this.clock = 5; // 发射频率
        this.bullys = [];  // 存放子弹的数组

        // 冲撞特性
        this.throwAble = true;
        this.viewRadius = 100;  // 冲撞视野
        this.bumpV = 12;  // 冲撞速度
        this.bumpDis = 50;  // 冲过的距离
        this.bumpEndPoint = null;  // 冲撞终点
        this.target = null;  // 冲撞目标
        this.bumpSpeedVector = Vector.zero();  // 冲撞速度向量
        this.bumpDamage = 5;  // 冲撞伤害

        // 终结者特性
        this.speedNumb = 0.3;  // 移动速度
        this.meeleAttacking = false;  // 是否进行近战攻击
        this.scar = new Set();  // 记录伤疤
    }

    // 更新目标
    refreshTarget() {
        for (let building of this.world.getAllBuildingArr()) {
            if (this.getViewCircle().impact(building.getBodyCircle())) {
                this.target = building;
                return;
            }
        }
    }

    // 判断是否有目标
    haveTarget() {
        return !(this.target === null || this.target === undefined || this.target.isDead());
    }

    // 设置冲撞结束点
    setEndPoint() {
        let dv = this.target.pos.sub(this.pos).to1();
        this.bumpEndPoint = this.target.pos.plus(dv.mul(this.bumpDis));
        this.bumpSpeedVector = this.target.pos.sub(this.pos).to1().mul(this.bumpV);
    }

    // 冲撞逻辑
    bump() {
        if (this.haveTarget()) {
            if (this.bumpEndPoint === null) {
                this.setEndPoint();
            }
            if (new Circle(this.bumpEndPoint.x, this.bumpEndPoint.y, 12).pointIn(this.pos.x, this.pos.y)) {
                if (this.haveTarget()) {
                    this.setEndPoint();
                } else {
                    this.bumpEndPoint = null;
                    this.bumpSpeedVector = Vector.zero();
                }
            } else {
                let ec = new EffectCircle(this.pos.copy());
                ec.circle.r = this.r;
                ec.initCircleStyle(this.bodyColor, this.bodyStrokeColor, 0);
                ec.animationFunc = ec.flashAnimation;
                this.world.addEffect(ec);

                this.pos.add(this.bumpSpeedVector);
            }
        } else {
            this.bumpEndPoint = null;
        }
    }

    // 终结者防御逻辑
    hpChange(dh) {
        let damage = -dh;
        if (damage < 10) {
            return;
        }
        if (damage < 100) {
            super.hpChange(-1);
        } else if (damage < 300) {
            super.hpChange(-5);
        } else if (damage < 500) {
            super.hpChange(-100);
        } else if (damage < 1500) {
            super.hpChange(-300);
        } else if (damage < 3000) {
            super.hpChange(-500);
        } else {
            super.hpChange(damage * 0.75);
        }
    }

    // 添加伤疤特效
    addScar() {
        let lc = new Line(this.pos.plus(Vector.randCircle().mul(Math.random() * this.r)),
            this.pos.plus(Vector.randCircle().mul(Math.random() * this.r)));
        lc.strokeColor = new MyColor(0, 0, 0, 0.2);
        lc.strokeWidth = 0.5;
        this.scar.add(lc);
    }

    // 射击逻辑
    attackAction() {
        if (this.liveTime % this.clock !== 0) {
            return;
        }
        if (this.haveTarget()) {
            this.dirction = this.target.pos.sub(this.pos).to1();
            this.fire();
        }
    }

    // 发射子弹
    fire() {
        let b = this.getRunningBully();
        this.bullys.push(b);
    }

    // 获取正在运行的子弹
    getRunningBully() {
        let res = this.getmMainBullyFunc();
        res.targetTower = true;
        res.originalPos = new Vector(this.pos.x, this.pos.y);
        res.world = this.world;
        res.pos = new Vector(this.pos.x, this.pos.y);
        let bDir = this.dirction.mul(this.bullySpeed);
        res.speed = bDir;
        res.slideRate = 1;
        return res;
    }

    // 碰撞检测
    clash() {
        this.meeleAttacking = false;
        for (let b of this.world.getAllBuildingArr()) {
            if (this.getBodyCircle().impact(b.getBodyCircle())) {
                this.bombSelf();
                this.meeleAttacking = true;
                b.hpChange(-this.bumpDamage);
            }
        }
    }

    // 移动逻辑
    move() {
        if (this.meeleAttacking) {
            return;
        }
        if (!this.haveTarget()) {
            super.move();
        }
    }

    // 每步更新逻辑
    goStep() {
        this.refreshTarget();
        this.attackAction();
        this.bump();
        super.goStep();
        for (let s of this.scar) {
            if (!s.isPlay) {
                this.scar.delete(s);
            }
        }
        for (let bully of this.bullys) {
            bully.goStep();
        }
    }

    // 渲染
    render(ctx) {
        super.render(ctx);
        new Circle(this.pos.x, this.pos.y, this.rangeR).renderView(ctx);
        for (let s of this.scar) {
            s.render(ctx);
        }
        for (let b of this.bullys) {
            b.render(ctx);
        }
    }
}
