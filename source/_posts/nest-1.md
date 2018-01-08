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

nest 通篇围绕**module**这个概念展开，将原本以`commonjs`规范为标准的模块化构建工程，改造为节点式的树状依赖模块关系，其中的每一个module都是一个节点，以节点为入为出，将实现代码封装在链路中并串联起来，透明掉了原本需要开发定义的模块关系，说简单点，就是把各实现代码模块之间的`require`交付给上层，而上层模块则根据业务需求划分，模块之间彼此互不依赖，模块内的业务单元以相同的结构化注入句柄把控制权反转给框架，从而可以统一做切面处理。这种松散应用耦合的设计，强壮了骨架，灵活了业务。看上去大家是不是有点眼熟呢，对，`angular`，还有`vue`（单文件组件），都是这样的设计思想，正是因为这样的解耦，使得应用层面可以放心的搭配而不必担心代码混乱，造成后期不好维护。

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

另外，我们无法规范每个开发人员的'引入习惯'，若没有一个好的架构设计支撑，协同开发出来的代码重复率有多高，看过众人的代码心里就会清楚。

nest意识到了这一点，所以通过泛型组织的方式将module抽象出来，加上js动态编译（解释）的特点，灵活的重组了模块间的耦合，改变了原来的设计思路，与其说是框架，nest更像是脚手架，高阶模块构建工具。

我们来看一下，通过nest的设计改造，上边的代码依赖关系变成如下：

    moduleA
        imports: [moduleB, moduleC]
        components: [#A]
        exports: [#A]

    moduleB
        imports: [moduleC]
        components: [#B]
        exports: [#B]

    moduleC
        imports: [moduleD]
        components: [#C]
        exports: [#C]

    moduleD
        components: [#D]
        exprots: [#D]

再看单个文件内容：

```js
#A:
    @Dependencies('b', 'c')
    (b, c)=>{
        this.b = b;
        this.c = c;
        return a
    }
```
```js
#B:
    @Dependencies('c')
    (c)=>{
        this.c = c;
        return b
    }
```
```js
#C:
    @Dependencies('d')
    (d)=>{
        this.d = d;
        return c
    }
```
```js
#D:
    @Dependencies()
    ()=>{
        return d;
    }
```





使用了装饰器'@'
这种AOP的解构思想，