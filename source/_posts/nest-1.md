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

nest 通篇围绕**module**这个概念展开，将原本以`commonjs`规范为标准的模块化构建工程，改造为节点式的树状依赖模块关系，其中的每一个module都是一个节点，以节点为入为出，将实现代码封装在链路中并串联起来，透明掉了原本需要开发定义的模块关系。

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

nest意识到了这一点，所以通过泛型对象将module抽象出来，加上js动态编译（解释）的特点，灵活的重组了模块间的耦合，改变了原来的项目结构，与其说是框架，nest更像是脚手架，或者高阶模块构建工具。

我们来看一下，通过nest的改造，上边的代码依赖关系变成如下：

    @moduleA
        imports: [moduleB, moduleC]
        components: [#A]
        exports: [#A]

    @moduleB
        imports: [moduleC]
        components: [#B]
        exports: [#B]

    @moduleC
        imports: [moduleD]
        components: [#C]
        exports: [#C]

    @moduleD
        components: [#D]
        exprots: [#D]

再看单个文件内容：

```js
#A:
    @Dependencies()
    export (b, c)=>{
        this.b = b;
        this.c = c;
        return a
    }
```
```js
#B:
    @Dependencies()
    export (c)=>{
        this.c = c;
        return b
    }
```
```js
#C:
    @Dependencies()
    export (d)=>{
        this.d = d;
        return c
    }
```
```js
#D:
    @Dependencies()
    export ()=>{
        return d;
    }
```

可以看到，单个文件内已经不需要引入其他依赖模块，转而变成了类导出，通过@Dependencies将所需要的模块注入，通过构造函数立即实例化并赋值给对象。这就是改造的流程控制反转，也叫依赖注入，即需要模块的时候已经提供好实例。有后台经验的同学看到这段代码应该不陌生吧，没错，就是受java的设计理念影响，nest参考ioc实现，遵循单一职责，依赖倒置原则，接口隔离原则，用链路传递依赖，用装饰代替定义。

这样做，其目的只有一个：**隔离**
隔离业务关系，隔离开发盲区，让协同的负影响降到最小。

### 代码实现

设计思路有了，接下来就是代码实现，上文中使用了@Dependencies作为注入句柄，作用就是将模块提供的类实例化后注入相应的业务对象中，起到粘合剂的作用，说着这儿，想必很多同学已经看懂了，这不就是装饰器工厂么，对的，所以接下来我们先复习一下功课。

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
    ... //这里实例化module引入的其他组件，控制器，服务模块等
    Object.defineProperty(target.prototype, 'module', module)
    return target;
}
let moduleA = require('moduleA');
let moduleB = require('moduleB');
let CatsModule = class CatsModule {};
let CatsController = require('CatsController');
let CatsService = require('CatsService');
CatsModule = moduleDecorator({
    modules: [moduleA, moduleB],
    controllers: [CatsController],
    components: [CatsService],
    exports: []
}, CatsModule);
exports.CatsModule = CatsModule;
```
这么写太难看了，优化一下
```js
...
let CatsModule = Object.
```

**装饰器**
> 装饰器是一种特殊类型的声明，它能够被附加到类声明，方法， 访问符，属性或参数上。 装饰器使用 @expression这种形式，expression求值后必须为一个函数，它会在运行时被调用，被装饰的声明信息做为参数传入。

以上是`TypeScript`对于装饰器的定义，让我们来复习下功课，

* [test](http://www.baidu.com)




使用了装饰器'@'
这种AOP的解构思想，