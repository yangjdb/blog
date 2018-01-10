---
title: nestjs 介绍（二）
comments: true
date: 2018-01-08 21:25:20
tags: nestjs
categories: 技术
keywords: nestjs node.js
---

## 原理
---

### 设计思路

nest 通篇围绕**module**这个概念展开，将原本以`commonjs`规范为标准的模块化构建工程，改造为节点式的图状依赖模块关系，其中的每一个module都是一个节点，以节点为入为出，将实现代码封装在链路中并串联起来，透明掉了原本需要开发定义的模块关系。

说简单点，就是把各实现代码模块之间的`require`交付给上层，而上层模块则根据业务需求划分，模块之间彼此互不依赖，模块内的业务单元以相同的结构化注入句柄（装饰器语法）把控制权反转给框架，从而做到统一的切面式处理。这种松散应用耦合的设计，强壮了骨架，透明了逻辑，灵活了业务。

这种设计思路大家是不是觉得有点眼熟呢，对，`angular`，还有`vue`（单文件组件），都是基于这样的思想，正是因为这样的解耦设计，使得应用层面可以放心的搭配模块或者组件而不必担心代码混乱，造成后期不好维护的局面。

废话不多说，还是举个栗子：
假设我们有A,B,C,D 4个文件，依赖如下:
```js
#A
import b from 'B';
import c from 'C';
...
export a;
```
```js
#B
import c from 'C';
...
export b;
```
```js
#C
import d from 'D';
...
export c;
```
```js
#D
export default d;
```
我们可以看到，对于C模块，有写法上有重复引入，虽然在node的执行环境里，只解释编码一次并常驻内存，但是我们知道。`commonjs`的规范，模块是副本传值，就意味着每引入一次，就会拷贝一份内存堆栈，虽然内存冗余问题并不大，但是对于有洁癖的程序员来说，这是不能忍的。

另外，我们无法规范每个开发人员的“引入习惯”，若没有一个好的架构设计支撑，协同开发出来的代码重复率有多高，看过整个项目的代码心里就会清楚。

nest意识到了这一点，所以通过泛型对象将module抽象出来，加上js动态编译（解释）的特点，灵活的重组了模块间的结构，改变了原来的耦合关系，与其说是框架，nest更像是脚手架，或者高阶模块构建工具。

我们来看一下，通过nest的改造，上边的代码依赖关系变成如下：

    moduleA
        imports: [moduleB, moduleC]
        components: [class A]
        exports: [instance of A]

    moduleB
        imports: [moduleC]
        components: [class B]
        exports: [instance of B]

    moduleC
        imports: [moduleD]
        components: [class C]
        exports: [instance of C]

    moduleD
        components: [class D]
        exprots: [instance of D]

每个module的结构都已约定，通过封装，可以作为独立的业务单元，之前以层级关系依赖变成了节点依赖的结构

再看每个类文件的内容：

```js
#A:
    @Dependencies()
    export (b, c)=>{
        this.b = b;
        this.c = c;
    }
```
```js
#B:
    @Dependencies()
    export (c)=>{
        this.c = c;
    }
```
```js
#C:
    @Dependencies()
    export (d)=>{
        this.d = d;
    }
```
```js
#D:
    @Dependencies()
    export ()=>{
        return 'hello world';
    }
```

可以看到，每个文件已经不需要引入其他依赖模块，而变成了类导出，通过@Dependencies将所需要的模块注入，@这个标记我们先暂且放一边不管他，Dependencies句柄通过构造函数立即实例化并赋值给对象。而这就是流程控制反转，也叫依赖注入，即需要模块的时候已经提供好实例。有后台经验的同学看到这段代码应该不陌生吧，没错，就是受java的设计理念影响，nest参考ioc实现，遵循单一职责，依赖倒置原则，接口隔离原则，用链路传递依赖，用装饰代替定义。

这样做，其目的只有一个：**隔离**
隔离业务关系，隔离开发盲区，让协同的负影响降到最小。

### 代码实现

设计思路有了，接下来就是代码实现，上文中提到了Dependencies作为注入句柄，作用就是将模块提供的类实例化后注入相应的业务对象中，起到粘合剂的作用，说着这儿，想必很多同学已经看懂了，这不就是装饰器工厂么，对的，所以接下来我们先复习一下功课。

    装饰器工厂是js设计模式之一，通过装饰类实现接口，以解决不同业务间适配问题。

同样，还是上代码：
```js
Interface IAnimal{
    speak(){}
}

class Cat implements IAnimal{
    speak(){
        console.log('miaomiao');
    }
}

class Dog implements IAnimal{
    speak(){
        console.log('wangwang');
    }
}
class AnimalDecorate {
    constructor(Animal){
        this.animal = new Animal;
    }

    animalSpeak(){
        this.animal.speak();
    }
}

var animal_1 = new AnimalDecorate(Dog);
var animal_2 = new AminalDecorate(Cat);
animal_1.animalSpeak(); //wangwang
animal_2.animalSpeak(); //miaomiao
```
这是一段简单的装饰器伪代码，可以看到AnimalDecorate通过注入不同的类，产生不同的实例，但是最终执行的业务代码却是一样。
那么复用到node的模块上面又该怎样？继续上代码
```js
let moduleDecorator = function(module, target){
    ... //注入其他module提供的实例，包括组件，控制器，服务模块等
    Object.defineProperty(target.prototype, 'module', module)
    ... //实例化本module
    return target;
}
let moduleB = require('moduleB');
let moduleC = require('moduleC');
let moduleA = class moduleA {};
let controallerA = require('controallerA');
let serviceA = require('serviceA');

moduleA = moduleDecorator({
    modules: [moduleA, moduleB],
    controllers: [controallerA],
    components: [serviceA],
    exports: [serviceA]
}, moduleA);

exports.moduleA = moduleA;
```
这段代码的作用只是将原有模块的类原型中添加其他实例，可以看出，我们只需要拿到类的句柄即可，装饰器moduleDecorator可以封装到核心库里。
所以，上边代码可以优化一下
```js
const core = require('core');
...
exports.moduleA = core.moduleDecorator({
   modules: [moduleA, moduleB],
   controllers: [controallerA],
   components: [serviceA],
   exports: [serviceA]
});
```
另外，es6提供了装饰器的实现，使用Reflect，还可以这样写
```js
const core = require('core');
...
core(Reflect.decorate(moduleA, 'module', {
   modules: [moduleA, moduleB],
   controllers: [controallerA],
   components: [serviceA],
   exports: [serviceA]
}));

exports.moduleA = moduleA;
```
但是这样还是不够优雅，不可能我们每个模块都这样写，也没有达到代码分离的作用，还是有很高的侵入性。而且由于Reflect.decorate（数据元反射）还是处在实验室阶段，所以还是`不推荐`使用

那么是不是没有解决办法了呢，TypeScript表示呵呵哒，原生语法不支持，我可以造语法进行编译啊！！所以 **@** 出现了

### 装饰器
> 装饰器是一种特殊类型的声明，它能够被附加到类声明，方法， 访问符，属性或参数上。 装饰器使用 @expression这种形式，expression求值后必须为一个函数，它会在运行时被调用，被装饰的声明信息做为参数传入。

以上便是`TypeScript`对于装饰器的定义，这里就不多做说明了，详情请移步：[TypeScript装饰器](https://www.tslang.cn/docs/handbook/decorators.html)
我重点介绍一下nest搭配ts常用的三种装饰器：类声明，方法，参数。

**类声明**
@module()：模块化依赖关系装饰
```js
@Module({
    modules: [ConfigModule, UtilModule],
    components: [CommonService],
    exports: [CommonService]
})
export class CommonModule {}
```
@global()：全局对象/变量装饰
```js
@global()
export class GlobalModule {}
```
@Component()：对象实例化装饰
```js
@Component()
export class CommonService {}
```
@Dependency()：对象实例注入装饰
```js
@Dependencies('Global', CommonService)
export class UserService{
    constructor(global, commonService) {
        this.global = global;
        this.commonService = commonService;
    }
}
```
@Controller()：路由装饰，之所以把路由单独成一个装饰器，是因为所有的服务入口都是基于路由控制，每个业务模块单元自实现MVC的业务流程，都是对象的集合，需要用标识来区分哪些是路由，哪些是服务，判断也仅仅需要一行代码
```js
@Controller('user')
export class UserController{}
```
@Middleware()：中间件装饰
```js
@Middleware()
export class LoggerMiddleware {
    resolve(...args) {
        return (req, res, next) => {
            console.log(`[${args}] Request...`);
            next();
        };
    }
}
```

**方法**
@Post：http post请求装饰
```js
@Post('/product/:id')
async productFindOne() {
}
```
@Get：http get请求装饰
```js
@Get('/login')
async login() {
}
```
@Bind：http 参数注入装饰，适用于ES
```js
@Post('/product/:id')
@Bind(Param(), Res())
async productFindOne(params, res) {
}
```
**参数**：参数装饰器，适用于TS
@Params()
@Req()
@Res()

```js
export class CatsController {
    @Get()
    findAll(@Params() params, @Req() request, @Res() res) {
    }
}
```
### 小结
装饰器工厂虽然不是新出的设计理念，但是在前端和node的应用场景却并不多，得益于java的控制反转，依赖注入实践参照，js使用装饰器完成了自身的反射机制，在框架层面上，angular补充了前端的空白，nest的出现补充了node的空白。这种核心层面向切面(AOP)，应用层面向对象(OOP)的编程方式，把node的模块依赖规则透明，使得项目结构耦合度很低，加上TS的预编译，模块复用率提高，拷贝成本大大降低，节省了内存消耗，这方面的性能测试报告后续会更新上来。

原理就先介绍到这里，欢迎大家指正。

### 推荐
* [Typescript中的装饰器原理](http://blog.csdn.net/5hongbing/article/details/77927788)
* [TypeScript 中的 Decorator & 元数据反射：从小白到专家](https://zhuanlan.zhihu.com/p/20297283)