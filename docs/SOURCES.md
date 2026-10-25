# 史料、声音与视觉表达

中文 | [English](SOURCES.en.md) · [返回项目首页](../README.md)

本页整理原版影片所依据的资料。资料支持岗位、设备与操作之间的关系；影片中的镜头、图形布局、地形与多数运动路径是重新创作的。

## 先区分两种时间、两种声音

**影片时间**跟随《Go!》的音乐剪辑；**GET** 是从阿波罗任务发射开始累计的真实任务时间。歌曲重排、重复了档案通话，不能用影片秒数推算 GET，也不能把重复采样当作历史上再次发生的点名。

配乐为 **Public Service Broadcasting — Go!**。本片没有另加一轨 NASA 人声。商业歌曲和历史录音是不同材料：前者用于音乐制作，后者用于核对话语身份与任务背景；两者均不随本仓库分发。

历史声音参考为 [Apollo Journals 的飞行指挥环路录音](https://apollojournals.org/alsj/a11/A11_landing_FD_loop.mp3)。[Honeysuckle Creek 的整理说明](https://www.honeysucklecreek.net/msfn_missions/MSFN/Network_A11_landing.html)记录了 NASA/JSC 磁带 963-AAE、964-AAE 的来源，以及 Colin Mackellar 的速度、音调与噪声修复工作。这是整理后的档案副本，不是商业歌曲的提取版。

制作节点的小数位用于稳定复现画面，不表示所有语音词首具有毫秒级证据。声音匹配、历史转录和后加评注也不能互相替代。

## 资料入口

| 资料 | 在影片中支持什么 |
| --- | --- |
| [NASA：Apollo Journals 官方入口](https://www.nasa.gov/history/alsj-and-afj/)；[下降与着陆转录](https://apollojournals.org/alsj/a11/a11.landing.html)；[着陆后活动](https://apollojournals.org/alsj/a11/a11.postland.html) | 点名、下降、报警、着陆和停留判断的语境；正文通话与后加说明有各自标记 |
| [NASA Apollo 11 技术空地通话转录](https://www.nasa.gov/wp-content/uploads/static/history/alsj/a11/a11transcript_tec.html) | 乘员与地面的实际通信；不包括全部内部控制席环路 |
| [NASA Apollo 11 实际事件表](https://www.nasa.gov/wp-content/uploads/static/history/SP-4029/Apollo_11i_Timeline.htm) | 动力下降、程序阶段、接地和关机等历史时刻 |
| [Apollo 11 Mission Report](https://www.nasa.gov/wp-content/uploads/static/apollo50th/pdf/A11_MissionReport.pdf)，§5.4 | 接地运动与飞行表现；不是为影片提供一条完整实时遥测曲线 |
| [Apollo 11 机组技术复盘](https://www.nasa.gov/wp-content/uploads/static/history/alsj/a11/a11tcdb.html)，§9.2、§10 | 观察地形、姿态与制动、尘埃、接地感受及着陆后的工作 |
| [NASA TN D-6846：Lunar Descent and Ascent](https://ntrs.nasa.gov/api/citations/19720018205/downloads/19720018205.pdf)，原印页 5–9、16–19 | P64/P66、下降几何、制导比较与继续任务的判断 |
| [Robert Carlton 口述史](https://www.nasa.gov/wp-content/uploads/2025/07/carltonrl-4-10-01.pdf)，35–39 页 | CONTROL 席位、实际推进性能与着陆余量的关系 |
| [NASA Mission Control 历史报告](https://www.nasa.gov/wp-content/uploads/2025/09/apollomc-habshaer.pdf)；[Apollo 13 新闻资料](https://www.nasa.gov/wp-content/uploads/static/history/afj/ap13fj/pdf-hr/60-a13-press-kit.pdf)，原印页 117 | 同时代控制席职责；后者仅用于岗位范围，不把 Apollo 13 事件移入本片 |
| [Don Eyles：Tales from the Lunar Module Guidance Computer](https://www.klabs.org/history/apollo_11_alarms/eyles_2004/eyles_2004.htm) | 1201/1202、工作区、Executive 与保护重启；来自参与登月软件开发者的技术回顾 |
| [NASA 登月舱环境控制报告](https://ntrs.nasa.gov/api/citations/19720013195/downloads/19720013195.pdf)；[NASA SP-368](https://ntrs.nasa.gov/api/citations/19760005606/downloads/19760005606.pdf) | LM 冷却与升华排热、CSM 冷却与散热器，以及二者资源系统的区别 |
| [Apollo 11 Mission Rules](https://www.nasa.gov/wp-content/uploads/static/history/alsj/a11/a11missionrules.pdf)，规则 3-102、原印页 3-26 | 月面停留、上升与会合所需资源的保留关系；不移植具体阈值 |
| [NASA Lunar Module Communications](https://ntrs.nasa.gov/api/citations/20090015392/downloads/20090015392.pdf)；[NASA 网络史](https://www.nasa.gov/communicating-with-missions/history-of-the-networks/)；[The Unified S-band Ground System](https://ntrs.nasa.gov/citations/19730026382) | 船间 VHF、面向地面的 S-band、视线遮挡和地面网络的职能 |
| [NASA Moon Facts](https://science.nasa.gov/moon/facts/) | 开头的 384,400 km 是地月平均距离，不是某个实飞时刻的测距读数 |

## 影片采用的关键区别

1. **Go 是继续任务的判断。** 它不是控制员远程给某个设备通电的开关。前期动力下降许可与后来继续着陆的许可是不同决定。
2. **LM 与 CSM 各有系统和职责。** CONTROL、TELMU/TELCOM 对应登月舱相关工作；GNC、EECOM 的指令／服务舱工作不能简单并成第二套 LM 面板。片中保留了不同段落的 TELMU/TELCOM 称呼，两者不意味着一个纯通信席位。
3. **报警不等于程序被抹掉。** 1202 关联无可用 core sets，1201 关联无可用 VAC areas；保护恢复保留必要工作。图形强调负担与持续制导，不把低优先级一概视为无用。
4. **人和计算机继续合作。** P66 并非拔掉计算机后的纯手动；姿态先改变加速度，再改变速度。地形判断、仪表报读和节流控制有不同作用。
5. **接触灯、脚垫承重与关机有区别。** 探针触月不代表四脚已同时落定。月尘是受喷流推动的弹道运动，不是地面式烟团。
6. **落地之后仍需判断能否停留。** Stay 保留上升、会合与返回能力，不等于飞船停机或已经出舱；T1 也不简单等于“着陆加一分钟”。
7. **结尾的三处空间仍是一项任务。** Armstrong 与 Aldrin 在月面，Collins 在轨道，地面继续支持。通信路径受视线遮挡约束，不能穿过月球。

## 艺术处理范围

模型比例细节、月面地形、相机飞行、线条长度、关系图的数值外观、轨道相位和图形节奏服务于影片叙事，并非完整的航天器工程模型、现场测绘或恢复出的遥测。地月空间被压缩；无数值图表用于表达关系，不可用于计算真实任务状态。

短时间出现的席位图形，是依据岗位和任务关系创作的视觉解释，不声称控制员在那声 Go 中逐项说出了所有理由。收尾没有另行叙述起飞、会合或出舱，保留的路线表示后续能力。

以上区别保存在幕后文档中。影片本身使用画面、节奏与声音推进，不插入解释性声明。
