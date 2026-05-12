const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const ROOT = __dirname;
const KAKOMON = path.join(ROOT, "Kakomon");
const TMP = path.join(ROOT, ".tmp_exam_blocks");
const ALLOW_MISSING_EXPLANATIONS = process.env.ALLOW_MISSING_EXPLANATIONS === "1";
const EXPLANATION_GAPS = [];
const EXTRA_EXPLANATIONS_PATH = path.join(ROOT, "manual_explanations.json");
const EXTRA_EXPLANATIONS_JS_PATH = path.join(ROOT, "manual_explanations.js");
const TERMS = [
  ["R7.5", "2025", "R07", "05", "令和7年5月期"],
  ["R6.12", "2024", "R06", "12", "令和6年12月期"],
  ["R6.8", "2024", "R06", "08", "令和6年8月期"],
  ["R6.4", "2024", "R06", "04", "令和6年4月期"],
  ["R5.12", "2023", "R05", "12", "令和5年12月期"],
  ["R5.8", "2023", "R05", "08", "令和5年8月期"],
  ["R5.4", "2023", "R05", "04", "令和5年4月期"],
  ["R4.12", "2022", "R04", "12", "令和4年12月期"],
  ["R4.8", "2022", "R04", "08", "令和4年8月期"],
  ["R4.4", "2022", "R04", "04", "令和4年4月期"],
  ["R3.12", "2021", "R03", "12", "令和3年12月期"],
  ["R3.9", "2021", "R03", "09", "令和3年9月期"],
  ["R3.4", "2021", "R03", "04", "令和3年4月期"],
];

const BUILTIN_MANUAL_EXPLANATIONS = {
  "HZ604:A-4": `
この問題は、理想変成器で負荷抵抗が一次側からどう見えるか、さらに最大電力条件を使えるかを問う問題です。

まず、理想変成器では電圧比は巻数比に等しくなります。

V1 / V2 = N1 / N2

また、電流比は逆になります。

I1 / I2 = N2 / N1

抵抗は R = V / I なので、二次側の負荷抵抗 RL を一次側から見た抵抗 Rab は、

Rab = V1 / I1
    = (N1 / N2)^2 RL

となります。

したがって、A は (N1 / N2)^2 RL です。

次に、電源の内部抵抗を RG としたとき、負荷に最大電力を供給する条件は、負荷側を見た抵抗が電源の内部抵抗と等しくなることです。

Rab = RG

したがって、B は RG です。

この条件では、内部抵抗 RG と負荷側抵抗 Rab が等しいため、電源電圧 V は半分ずつ分圧されます。

負荷側にかかる電圧は V/2 です。

よって最大電力 Pm は、

Pm = (V/2)^2 / RG
   = V^2 / (4RG)

したがって、C は V^2/(4RG) です。

A = (N1/N2)^2 RL
B = RG
C = V^2/(4RG)

この組合せは 3 なので、正解は 3 です。
`.trim(),
  "HZ705:A-2": `
この問題は、直列接続したコンデンサに加えられる最大電圧を求める問題です。

直列接続のコンデンサでは、すべてのコンデンサに同じ電荷 Q が蓄えられます。

Q = C V

したがって、同じ Q で比べると、容量 C が小さいコンデンサほど電圧 V が大きくなります。

今回の静電容量は、

8 μF、10 μF、16 μF

です。

いちばん容量が小さい 8 μF のコンデンサが、最初に耐電圧 40 V に達します。

このときの電荷 Q は、

Q = 8 μF × 40 V
  = 320 μC

です。

この同じ電荷 320 μC が、10 μF と 16 μF のコンデンサにも蓄えられます。

10 μF にかかる電圧は、

V = Q / C
  = 320 μC / 10 μF
  = 32 V

16 μF にかかる電圧は、

V = 320 μC / 16 μF
  = 20 V

よって、直列全体に加えられる最大電圧は、

40 V + 32 V + 20 V = 92 V

となります。

したがって、正解は 4 です。
`.trim(),
  "HZ705:A-5": `
この問題は、電源に重畳した 10 MHz の雑音を、コイルのリアクタンスでどれだけ落とせるかを求める問題です。

負荷抵抗は 100 Ω です。

コイルを直列に入れると、10 MHz の雑音に対してコイルはリアクタンス XL を持ちます。

XL = 2πfL

負荷側の雑音電圧は、抵抗 R とコイルのリアクタンス XL による分圧で決まります。

電圧の減衰量が 34 dB なので、電圧比は、

20 log10(Vin / Vout) = 34

Vin / Vout = 10^(34/20)
           ≒ 50

つまり、負荷に出る雑音電圧を約 1/50 にすればよいことになります。

R = 100 Ω に対して、直列リアクタンス XL が十分大きいとき、

Vin / Vout ≒ XL / R

と見なせます。

したがって、

XL ≒ 50 × 100 Ω
   = 5000 Ω

です。

周波数は 10 MHz なので、

L = XL / (2πf)
  = 5000 / (2π × 10×10^6)
  ≒ 8.0×10^-5 H
  = 80 μH

最も近い値を選ぶので、正解は 2 です。
`.trim(),
  "HZ705:A-12": `
この問題は、AM(A3E)波の平均電力を、搬送波電力と変調度から求める問題です。

AM波の平均電力 P は、搬送波電力を Pc、変調度を m とすると、

P = Pc (1 + m^2 / 2)

で求めます。

問題では、変調をかけないときの送信電力、つまり搬送波電力が、

Pc = 750 W

です。

変調度は 80 % なので、小数に直して、

m = 0.8

です。

式に代入します。

P = 750 × (1 + 0.8^2 / 2)
  = 750 × (1 + 0.64 / 2)
  = 750 × (1 + 0.32)
  = 750 × 1.32
  = 990 W

したがって、送信電力は約 990 W です。

正解は 3 です。
`.trim(),
  "HZ705:A-25": `
この問題は、進行波電力と反射波電力から、SWR とリターンロスを求める問題です。

進行波電力は、

Pf = 1000 W

反射波電力は、

Pr = 40 W

です。

まず、反射係数の大きさ |Γ| を求めます。

Pr / Pf = |Γ|^2

なので、

|Γ| = √(Pr / Pf)
    = √(40 / 1000)
    = √0.04
    = 0.2

次に、SWR は、

SWR = (1 + |Γ|) / (1 - |Γ|)

です。

SWR = (1 + 0.2) / (1 - 0.2)
    = 1.2 / 0.8
    = 1.5

次に、リターンロスを求めます。

リターンロス = 10 log10(Pf / Pr)

Pf / Pr = 1000 / 40 = 25

10 log10 25 は約 14 dB です。

したがって、

SWR = 1.5
リターンロス ≒ 14 dB

この組合せなので、正解は 4 です。
`.trim(),
  "HZ608:A-6": `
この問題は、位相差を時間差に換算する問題です。

周波数は、

f = 10 MHz

です。

周期 T は周波数の逆数なので、

T = 1 / f
  = 1 / (10×10^6)
  = 0.1 μs
  = 100 ns

です。

位相差は 3π/4 rad です。

1周期は 2π rad なので、3π/4 rad は何周期分かを求めると、

(3π/4) / (2π)
  = 3/8

です。

したがって時間差は、

100 ns × 3/8
  = 37.5 ns

となります。

最も近い値を選ぶので、正解は 5 です。
`.trim(),
  "HZ608:A-24": `
この問題は、減衰器を通した後の電力から、元の送信機出力を求める問題です。

減衰器の減衰量は 17 dB です。

電力比の dB は、

L = 10 log10(Pin / Pout)

で表します。

したがって、

Pin / Pout = 10^(L/10)

です。

L = 17 dB なので、

Pin / Pout = 10^(17/10)
           = 10^1.7
           ≒ 50

電力計の指示値は、減衰器を通過した後の電力なので、

Pout = 50 mW

です。

したがって送信機の出力電力は、

Pin ≒ 50 mW × 50
    = 2500 mW
    = 2.5 W

最も近い値を選ぶので、正解は 3 です。
`.trim(),
  "HZ309:A-10": `
この問題は、標本化したデジタル信号のビットレートを求める問題です。

標本化周波数は、

24 kHz

です。

これは 1 秒間に 24,000 個の標本を送るという意味です。

各標本は 16 ビットで量子化されます。

さらに、誤り訂正符号を 2 ビット付加するので、1標本あたりのビット数は、

16 + 2 = 18 ビット

です。

したがって、ビットレートは、

24,000 × 18
  = 432,000 bit/s

となります。

432,000 bit/s は、

432 kbit/s

です。

したがって、正解は 5 です。
`.trim(),
  "HZ512:A-19": `
この問題は、AM(A3E)送信機の搬送波電力から、100%変調時の同軸ケーブル電圧の最大値を求める問題です。

まず、無変調時の送信電力は搬送波電力です。

Pc = 800 W

同軸ケーブルの特性インピーダンスは 50 Ω で、両端は整合しているので、搬送波の実効値電圧 Vc は、

Pc = Vc^2 / R

から求められます。

Vc = √(Pc R)
   = √(800 × 50)
   = √40000
   = 200 V

これは実効値です。

正弦波の最大値は実効値の √2 倍なので、搬送波電圧の最大値は、

200√2 V

です。

AMで変調度 100% のとき、包絡線の最大値は搬送波振幅の 2 倍になります。

したがって、同軸ケーブルに加わる電圧の最大値は、

2 × 200√2
  = 400√2 V

です。

よって、正解は 3 です。
`.trim(),
  "HZ512:A-25": `
この問題は、VSWR から反射波電力とリターンロスを求める問題です。

進行波電力は、

Pf = 100 W

VSWR は、

S = 3.0

です。

まず、VSWR から電圧反射係数 |Γ| を求めます。

|Γ| = (S - 1) / (S + 1)
    = (3 - 1) / (3 + 1)
    = 2 / 4
    = 0.5

反射波電力は、進行波電力に |Γ|^2 を掛けます。

Pr = |Γ|^2 Pf
   = 0.5^2 × 100
   = 0.25 × 100
   = 25 W

次にリターンロスを求めます。

リターンロス = 10 log10(Pf / Pr)

Pf / Pr = 100 / 25 = 4

log10 2 ≒ 0.3 なので、

log10 4 = log10(2^2)
        = 2 log10 2
        ≒ 0.6

したがって、

10 log10 4 ≒ 6 dB

反射波電力 25 W、リターンロス 6 dB の組合せなので、正解は 2 です。
`.trim(),
  "HZ508:A-13": `
この問題は、AM(A3E)波の平均電力と変調度から、無変調時の搬送波電力を逆算する問題です。

AM波の平均電力 P は、搬送波電力を Pc、変調度を m とすると、

P = Pc(1 + m^2 / 2)

です。

問題では、被変調波の平均電力が、

P = 450 W

変調度が、

m = 0.8

です。

式を Pc について解くと、

Pc = P / (1 + m^2 / 2)

です。

代入します。

Pc = 450 / (1 + 0.8^2 / 2)
   = 450 / (1 + 0.64 / 2)
   = 450 / 1.32
   ≒ 341 W

選択肢では 340 W が最も近い値です。

したがって、正解は 2 です。
`.trim(),
  "HZ508:A-20": `
この問題は、負荷抵抗 75 Ω を 50 Ω の無損失給電線につないだときの、反射係数、VSWR、リターンロスを求める問題です。

給電線の特性インピーダンスは、

Z0 = 50 Ω

負荷抵抗は、

RL = 75 Ω

です。

負荷が純抵抗のとき、電圧反射係数 Γ は、

Γ = (RL - Z0) / (RL + Z0)

で求めます。

Γ = (75 - 50) / (75 + 50)
  = 25 / 125
  = 0.2

次に VSWR は、

S = (1 + |Γ|) / (1 - |Γ|)

です。

S = (1 + 0.2) / (1 - 0.2)
  = 1.2 / 0.8
  = 1.5

リターンロスは、

リターンロス = -20 log10 |Γ|

です。

|Γ| = 0.2 = 1/5 なので、

-20 log10(0.2)
= 20 log10 5

5 = 10 / 2 ですから、

log10 5 = 1 - log10 2
        ≒ 1 - 0.3
        = 0.7

よって、

20 × 0.7 = 14 dB

です。

電圧反射係数 0.2、VSWR 1.5、リターンロス 14 dB の組合せなので、正解は 3 です。
`.trim(),
  "HZ504:A-10": `
この問題は、PCM方式のビットレートを求める問題です。

ビットレートは、

標本化周波数 × 1標本あたりのビット数

で求めます。

標本化周波数は、

32 kHz

です。

つまり、1秒間に 32,000 個の標本を送ります。

各標本は 12 ビットで量子化され、さらに誤り訂正符号を 2 ビット付加します。

したがって、1標本あたりのビット数は、

12 + 2 = 14 ビット

です。

よって、ビットレートは、

32,000 × 14
  = 448,000 bit/s

です。

これは、

448 kbps

に相当します。

したがって、正解は 5 です。
`.trim(),
  "HZ504:A-19": `
この問題は、複素数で与えられた電圧反射係数から VSWR を求める問題です。

電圧反射係数は、

Γ = 0.224 + j0.2

です。

VSWR に使うのは、複素数そのものではなく大きさ |Γ| です。

|Γ| = √(0.224^2 + 0.2^2)

0.224^2 は約 0.050、0.2^2 は 0.040 なので、

|Γ| ≒ √0.090
     ≒ 0.30

です。

VSWR は、

S = (1 + |Γ|) / (1 - |Γ|)

で求めます。

S ≒ (1 + 0.30) / (1 - 0.30)
  = 1.30 / 0.70
  ≒ 1.86

選択肢では 1.9 が最も近い値です。

したがって、正解は 3 です。
`.trim(),
  "HZ504:A-24": `
この問題は、オシロスコープに表示された二つの正弦波の横方向のずれから、位相差を読む問題です。

同じ周波数の正弦波では、1周期分の横幅が 2π rad に対応します。

したがって、まず図で「1周期が横方向に何目盛か」を見ます。

次に、二つの波形の同じ点、たとえば山と山、または同じ向きにゼロを横切る点どうしのずれを読みます。

図では、二つの波形のずれが 1周期の 5/12 に相当します。

1周期は 2π rad なので、

位相差 = 2π × 5/12
       = 10π/12
       = 5π/6 rad

となります。

したがって、正解は 1 です。
`.trim(),
  "HZ412:A-9": `
この問題は、発振回路の共振周波数がコンデンサの容量変化でどう変わるかを求める問題です。

LC発振回路の発振周波数は、

f = 1 / (2π√LC)

です。

L が一定なら、周波数 f は √C に反比例します。

問題では、コンデンサ C が 36% 減少します。

つまり、新しい容量は元の、

100% - 36% = 64%

です。

C' = 0.64 C

なので、新しい周波数 f' は、

f' / f = 1 / √0.64
       = 1 / 0.8
       = 1.25

です。

つまり、周波数は元の 1.25 倍、すなわち 25% 増加します。

したがって、正解は 1 です。
`.trim(),
  "HZ412:A-11": `
この問題は、AM(A3E)波の実効値電圧を、搬送波の最大値と変調度から求める問題です。

無変調時の搬送波電圧の振幅値、つまり最大値は、

Vc(max) = 100 V

です。

正弦波の実効値は最大値の 1/√2 なので、搬送波の実効値 Vc は、

Vc = 100 / √2
   ≒ 70.7 V

です。

AM波の平均電力は、

P = Pc(1 + m^2 / 2)

です。

同じ抵抗負荷で考えると、電力は電圧実効値の2乗に比例します。

したがって、変調波の実効値 V は、

V = Vc √(1 + m^2 / 2)

です。

変調度は 50% なので、

m = 0.5

です。

代入します。

V = 70.7 × √(1 + 0.5^2 / 2)
  = 70.7 × √(1 + 0.25 / 2)
  = 70.7 × √1.125
  ≒ 70.7 × 1.06
  ≒ 75 V

したがって、正解は 3 です。
`.trim(),
  "HZ412:A-25": `
この問題は、進行波電力と反射波電力から SWR を求める問題です。

進行波電力は、

Pf = 900 W

反射波電力は、

Pr = 144 W

です。

まず反射係数の大きさ |Γ| を求めます。

Pr / Pf = |Γ|^2

なので、

|Γ| = √(Pr / Pf)
    = √(144 / 900)
    = 12 / 30
    = 0.4

次に、SWR は、

S = (1 + |Γ|) / (1 - |Γ|)

です。

S = (1 + 0.4) / (1 - 0.4)
  = 1.4 / 0.6
  ≒ 2.33

最も近い値は 2.3 です。

したがって、正解は 1 です。
`.trim(),
  "HZ408:A-11": `
この問題は、電力増幅器の利得と整合器の損失を dB で合成して、出力電力を求める問題です。

入力電力は、

Pin = 35 W

電力増幅器の利得は 15 dB、整合器の損失は 1 dB です。

dB 表示では、利得は足し、損失は引きます。

したがって、全体の利得は、

15 dB - 1 dB = 14 dB

です。

電力比の dB は、

G[dB] = 10 log10(Pout / Pin)

なので、

Pout / Pin = 10^(14/10)

です。

log10 2 ≒ 0.3 なので、

14 dB は電力比で約 25 倍です。

理由は、

10 log10 25
= 10 log10(100/4)
= 10(2 - log10 4)
= 10(2 - 0.6)
= 14 dB

となるためです。

したがって、

Pout ≒ 35 W × 25
     = 875 W

です。

よって、正解は 2 です。
`.trim(),
  "HZ408:A-24": `
この問題は、3点法で接地抵抗を求める問題です。

端子①に接続された接地板の接地抵抗を R1、端子②の補助接地棒を R2、端子③の補助接地棒を R3 とします。

問題で与えられている測定値は、

①-②間: R1 + R2 = 70 Ω
①-③間: R1 + R3 = 50 Ω
②-③間: R2 + R3 = 90 Ω

です。

求めたいのは R1 です。

上の3式のうち、最初の2式を足します。

(R1 + R2) + (R1 + R3)
= 70 + 50

左辺は、

2R1 + R2 + R3

です。

ここから、R2 + R3 = 90 Ω を引くと、

2R1 = 70 + 50 - 90
    = 30

したがって、

R1 = 15 Ω

です。

よって、正解は 1 です。
`.trim(),
  "HZ404:A-8": `
この問題は、FET 増幅回路の電圧増幅度を、相互コンダクタンスと負荷抵抗から求める問題です。

図の等価回路では、ドレイン側にドレイン抵抗 rd と負荷抵抗 RL が並列に接続されています。

したがって、出力側の合成抵抗 R は、

R = rd || RL

です。

数値は、

rd = 15 kΩ
RL = 5 kΩ

なので、

R = (15 kΩ × 5 kΩ) / (15 kΩ + 5 kΩ)
  = 75 / 20 kΩ
  = 3.75 kΩ

です。

FET の小信号電流は、

id = gm Vgs

で表されます。

この電流が出力側の合成抵抗 R に流れるので、出力電圧の大きさは、

Vds = gm Vgs R

となります。

したがって、電圧増幅度の大きさは、

|Vds / Vgs| = gm R

です。

相互コンダクタンスは、

gm = 8 mS = 0.008 S

なので、

|Vds / Vgs| = 0.008 × 3750
             = 30

です。

したがって、正解は 2 です。
`.trim(),
  "HZ404:A-17": `
この問題は、ブリッジ整流回路で、各ダイオードに加わる逆方向最大電圧を求める問題です。

交流入力の実効値は、

Vrms = 200 V

です。

正弦波の最大値 Vm は、実効値の √2 倍なので、

Vm = √2 Vrms
   = 200√2
   ≒ 283 V

です。

コンデンサ入力形の無負荷状態では、コンデンサはおおむね入力電圧のピーク値まで充電されます。

ブリッジ整流回路では、導通していないダイオードに加わる逆方向電圧の最大値は、基本的にこのピーク値 Vm です。

センタータップ式全波整流のように 2Vm にはなりません。

したがって、各ダイオードに加わる逆方向最大電圧は、

約 283 V

です。

よって、正解は 1 です。
`.trim(),
  "HZ404:A-19": `
この問題は、アンテナ電流、入力抵抗、放射抵抗から、放射電力と放射効率を求める問題です。

アンテナ電流は、

I = 3 A

放射抵抗は、

Rr = 36 Ω

です。

放射電力 Pr は、放射抵抗で消費される電力として、

Pr = I^2 Rr

で求めます。

Pr = 3^2 × 36
   = 9 × 36
   = 324 W

です。

次に、放射効率を求めます。

入力抵抗は、

Rin = 50 Ω

です。

整合回路の損失がない条件なので、アンテナに入った電力のうち、放射抵抗に相当する分が放射されます。

放射効率 η は、

η = Rr / Rin
  = 36 / 50
  = 0.72

です。

百分率では、

72%

です。

したがって、放射電力 324 W、放射効率 72% の組合せになり、正解は 2 です。
`.trim(),
  "HZ404:A-24": `
この問題は、減衰器を通して測った電力から、送信機の元の出力電力を求める問題です。

減衰器の減衰量は、

27 dB

です。

電力比の dB は、

L = 10 log10(Pin / Pout)

で表します。

したがって、

Pin / Pout = 10^(L/10)

です。

L = 27 dB なので、

Pin / Pout = 10^(27/10)
           = 10^2.7

ここで、log10 2 ≒ 0.3 なので、

10^0.7 = 10^(1 - 0.3)
       = 10 / 2
       = 5

です。

したがって、

10^2.7 = 10^2 × 10^0.7
       = 100 × 5
       = 500

となります。

電力計の指示値は、減衰器を通過した後の電力です。

Pout = 10 mW

なので、送信機出力 Pin は、

Pin = 10 mW × 500
    = 5000 mW
    = 5 W

です。

したがって、正解は 1 です。
`.trim(),
  "HZ304:A-24": `
この問題は、SWR と進行波電力から反射波電力を求める問題です。

進行波電力は、

Pf = 900 W

SWR は、

S = 2.0

です。

まず、SWR から反射係数 |Γ| を求めます。

|Γ| = (S - 1) / (S + 1)
    = (2 - 1) / (2 + 1)
    = 1 / 3

反射波電力は、

Pr = |Γ|^2 Pf

で求めます。

Pr = (1/3)^2 × 900
   = 1/9 × 900
   = 100 W

したがって、正解は 1 です。
`.trim(),
  "HZ312:A-12": `
この問題は、AM(A3E)波の平均電力から変調度を逆算する問題です。

AM波の平均電力 P は、搬送波電力を Pc、変調度を m とすると、

P = Pc(1 + m^2 / 2)

です。

問題では、

Pc = 200 W
P = 280 W

です。

まず比を取ります。

P / Pc = 280 / 200
       = 1.4

したがって、

1 + m^2 / 2 = 1.4

です。

両辺から 1 を引くと、

m^2 / 2 = 0.4

です。

両辺を 2 倍して、

m^2 = 0.8

となります。

m = √0.8
  ≒ 0.894

です。

百分率では約 89.4% なので、最も近い値は 90% です。

したがって、正解は 4 です。
`.trim(),
  "HZ312:A-20": `
この問題は、同じ距離で電界強度が等しくなる条件から、八木アンテナの相対利得を求める問題です。

同じ距離、同じ方向で比較すると、電界強度は、

√(送信電力 × アンテナ利得)

に比例します。

半波長ダイポールでは、

P1 = 500 W
G1 = 1

と考えます。

八木アンテナでは、

P2 = 25 W
G2 = 求める利得

です。

電界強度が等しいので、

P1 G1 = P2 G2

です。

したがって、

500 × 1 = 25 × G2

G2 = 500 / 25
   = 20

です。

つまり、八木アンテナは半波長ダイポールに対して電力比で 20 倍の利得を持つことになります。

dB に直すと、

10 log10 20
= 10 log10(2 × 10)
= 10(log10 2 + 1)
≒ 10(0.3 + 1)
= 13 dB

です。

したがって、正解は 3 です。
`.trim(),
  "HZ309:A-2": `
この問題は、環状鉄心の磁束密度から、コイル電流を求める問題です。

環状鉄心では、磁路長をおおよそ円周長として考えます。

磁路長 l は、

l = 2πr

です。

半径は 4 cm なので、

r = 0.04 m

です。

磁界の強さ H は、

H = NI / l

です。

また、磁束密度 B は、

B = μH

で、透磁率 μ は、

μ = μ0 μr

です。

したがって、

B = μ0 μr NI / (2πr)

となります。

これを I について解くと、

I = B・2πr / (μ0 μr N)

です。

数値を代入します。

B = 5 T
r = 0.04 m
μ0 = 4π×10^-7 H/m
μr = 2000
N = 250

I = 5 × 2π × 0.04 / (4π×10^-7 × 2000 × 250)

分子は、

5 × 0.08π = 0.4π

分母は、

4π×10^-7 × 500000
= 0.2π

したがって、

I = 0.4π / 0.2π
  = 2 A

よって、正解は 2 です。
`.trim(),
  "HZ309:A-13": `
この問題は、FM(F3E)通信の占有周波数帯幅をカーソンの法則で求める問題です。

FMの占有周波数帯幅の近似式は、

B ≒ 2(Δf + fs)

です。

ここで、

Δf: 最大周波数偏移
fs: 変調信号の最高周波数

です。

問題では、

Δf = 3.25 kHz
fs = 3 kHz

です。

代入します。

B ≒ 2(3.25 + 3)
  = 2 × 6.25
  = 12.5 kHz

したがって、正解は 2 です。
`.trim(),
  "HZ309:A-20": `
この問題は、送信アンテナの電力・利得・高さから、受信点の電界強度を求める問題です。

まず、送信アンテナによる直接波の電界強度 E0 を考えます。

半波長ダイポールに対する相対利得は 13 dB です。

13 dB は電力比で、

10^(13/10) ≒ 20

です。

送信電力は 20 W なので、

P × G = 20 × 20 = 400

です。

この条件で距離 20 km の直接波電界強度 E0 は、標準的な式から、

E0 = 7√(PG) / d

で求めます。

d = 20,000 m なので、

E0 = 7√400 / 20000
   = 7 × 20 / 20000
   = 0.007 V/m

です。

次に、問題文で与えられた地表反射を含む式を使います。

E = E0 × 4πh1h2 / (λd)

周波数は 150 MHz なので、波長 λ は、

λ = 300 / 150
  = 2 m

です。

アンテナ高は、

h1 = 20 m
h2 = 10 m

距離は、

d = 20,000 m

です。

代入すると、

E = 0.007 × 4π × 20 × 10 / (2 × 20000)

4π × 20 × 10 / (2 × 20000)
= 800π / 40000
= π / 50
≒ 0.0628

したがって、

E ≒ 0.007 × 0.0628
  ≒ 0.00044 V/m

です。

0.00044 V/m は、

440 μV/m

です。

よって、正解は 4 です。
`.trim(),
  "HZ304:A-21": `
この問題は、半波長ダイポールアンテナで受信したときの受信機入力電圧を求める問題です。

周波数は、

f = 7 MHz

です。

波長 λ は、

λ = 300 / f[MHz]
  = 300 / 7
  ≒ 42.9 m

です。

半波長ダイポールの実効長は、おおよそ、

he = λ / π

で扱います。

したがって、

he ≒ 42.9 / π
   ≒ 13.6 m

です。

電界強度は、

E = 30 mV/m
  = 0.03 V/m

です。

アンテナの誘起電圧 V0 は、

V0 = E he
   = 0.03 × 13.6
   ≒ 0.408 V

です。

図では、アンテナの入力抵抗 r と受信機の入力抵抗 R が整合している条件です。

整合していると、電圧は r と R で半分ずつ分かれるため、受信機入力端子 a-b 間の電圧は、

Vab = V0 / 2
    ≒ 0.408 / 2
    ≒ 0.204 V

です。

0.204 V は、

204 mV

なので、最も近い値は 200 mV です。

したがって、正解は 5 です。
`.trim()
};

const EXTRA_MANUAL_EXPLANATIONS = fs.existsSync(EXTRA_EXPLANATIONS_PATH)
  ? JSON.parse(fs.readFileSync(EXTRA_EXPLANATIONS_PATH, "utf8"))
  : {};
const EXTRA_MANUAL_EXPLANATIONS_JS = fs.existsSync(EXTRA_EXPLANATIONS_JS_PATH)
  ? require(EXTRA_EXPLANATIONS_JS_PATH)
  : {};
const MANUAL_EXPLANATIONS = {
  ...BUILTIN_MANUAL_EXPLANATIONS,
  ...EXTRA_MANUAL_EXPLANATIONS,
  ...EXTRA_MANUAL_EXPLANATIONS_JS,
};

function examsFor(subject) {
  const prefix = subject === "houki" ? "HY" : "HZ";
  return TERMS.map(([id, year, reiwa, month, title]) => ({
    id,
    title,
    subject,
    label: subject === "houki" ? "法規" : "無線工学",
    code: `${prefix}${Number(reiwa.slice(1))}${month}`,
    out: `${subject}_${id}.html`,
    pdf: `Kakomon/1ama-${year}(${reiwa})-${month}-${subject}.pdf`,
    answerPdf: `Kakomon/1ama-${year}(${reiwa})-${month}-${subject}-kaitou.pdf`,
    aCount: subject === "houki" ? 24 : 25,
    bCount: subject === "houki" ? 6 : 5,
  }));
}

function cleanDir(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
}

function normalizeText(text) {
  return text
    .replace(/[０-９]/g, (ch) => String(ch.charCodeAt(0) - 0xff10))
    .replace(/[ＡＡА]/g, "A")
    .replace(/[ＢВ]/g, "B")
    .replace(/[－ー―一]/g, "-")
    .replace(/[＊※]/g, "*");
}

function parseAnswers(exam) {
  const text = normalizeText(execFileSync("pdftotext", [path.join(ROOT, exam.answerPdf), "-"], { encoding: "utf8" }));
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const a = Array(exam.aCount).fill(null);
  const bFlat = [];

  for (let i = 0; i < lines.length - 1; i += 1) {
    const m = lines[i].replace(/\s/g, "").match(/^〔A-([0-9]{1,2})〕$/);
    if (!m) continue;
    const n = Number(m[1]);
    if (n < 1 || n > exam.aCount) continue;
    for (let j = i + 1; j < Math.min(lines.length, i + 5); j += 1) {
      if (/^([0-9]+|\*)$/.test(lines[j])) {
        a[n - 1] = lines[j] === "*" ? "*" : Number(lines[j]);
        break;
      }
    }
  }

  if (a.some((value) => value == null)) {
    const marker = text.indexOf("B問題\n正答");
    if (marker < 0) throw new Error(`${exam.code}: answer marker not found`);
    const numbers = [...text.slice(marker).matchAll(/^\s*([0-9]+|\*)\s*$/gm)].map((m) => (m[1] === "*" ? "*" : Number(m[1])));
    if (numbers.length < exam.aCount + exam.bCount * 5) {
      throw new Error(`${exam.code}: not enough numeric answers (${numbers.length})`);
    }
    numbers.slice(0, exam.aCount).forEach((value, index) => {
      a[index] = value;
    });
  }

  for (let i = 0; i < lines.length - 1; i += 1) {
    if (!/^[アイウエオ]$/.test(lines[i])) continue;
    for (let j = i + 1; j < Math.min(lines.length, i + 4); j += 1) {
      if (/^[0-9]+$/.test(lines[j])) {
        bFlat.push(Number(lines[j]));
        break;
      }
    }
  }

  const bTotal = exam.bCount * 5;
  let bValues = bFlat.length >= bTotal ? bFlat.slice(0, bTotal) : null;
  if (!bValues) {
    const lastNumbers = [...text.matchAll(/^\s*([0-9]+)\s*$/gm)].map((m) => Number(m[1]));
    bValues = lastNumbers.slice(-bTotal);
  }
  if (a.length !== exam.aCount || a.some((value) => value == null)) throw new Error(`${exam.code}: A answers incomplete`);
  if (bValues.length !== bTotal) throw new Error(`${exam.code}: B answers incomplete`);
  return {
    a,
    b: Array.from({ length: exam.bCount }, (_, i) => bValues.slice(i * 5, i * 5 + 5)),
  };
}

function pageSize(pdfPath) {
  const info = execFileSync("pdfinfo", [pdfPath], { encoding: "utf8" });
  const match = info.match(/Page size:\s+([\d.]+)\s+x\s+([\d.]+)\s+pts/);
  if (!match) throw new Error(`Page size not found: ${pdfPath}`);
  return { width: Number(match[1]), height: Number(match[2]) };
}

function imageSize(file) {
  const out = execFileSync("identify", ["-format", "%w %h", file], { encoding: "utf8" });
  const [width, height] = out.trim().split(/\s+/).map(Number);
  return { width, height };
}

function renderPages(exam, dir) {
  const prefix = path.join(dir, "page");
  execFileSync("pdftoppm", ["-png", "-r", "160", path.join(ROOT, exam.pdf), prefix], { cwd: ROOT });
  return fs.readdirSync(dir)
    .filter((f) => /^page-\d+\.png$/.test(f))
    .sort((a, b) => Number(a.match(/\d+/)[0]) - Number(b.match(/\d+/)[0]))
    .map((f) => path.join(dir, f));
}

function expectedIds(exam) {
  return Array.from({ length: exam.aCount }, (_, i) => `A-${i + 1}`).concat(Array.from({ length: exam.bCount }, (_, i) => `B-${i + 1}`));
}

function startsFromTsv(exam, pdfPath, tsvPath) {
  execFileSync("pdftotext", ["-tsv", pdfPath, tsvPath], { cwd: ROOT });
  const words = tsvWords(tsvPath)
    .map((word) => ({ ...word, text: word.text.replace(/\s/g, "") }))
    .filter((word) => word.text && word.left < 170 && !word.text.startsWith("###"));

  const groups = [];
  for (const word of words.sort((a, b) => a.page - b.page || a.top - b.top || a.left - b.left)) {
    let group = groups.find((item) => item.page === word.page && Math.abs(item.top - word.top) < 4);
    if (!group) {
      group = { page: word.page, top: word.top, items: [] };
      groups.push(group);
    }
    group.items.push(word);
  }

  const starts = [];
  for (const group of groups) {
    const text = group.items.sort((a, b) => a.left - b.left).map((item) => item.text).join("");
    const match = text.match(/^([AB])-?([0-9]{1,2})/) || text.match(/^([AB])-([0-9]{1,2})/);
    if (!match) continue;
    starts.push({ page: group.page, y: group.top, id: `${match[1]}-${Number(match[2])}` });
  }

  const seen = new Set();
  const unique = starts.filter((start) => {
    const key = `${start.page}:${start.id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).sort((a, b) => a.page - b.page || a.y - b.y);

  const expected = expectedIds(exam);
  const got = unique.map((start) => start.id);
  if (JSON.stringify(got) !== JSON.stringify(expected)) {
    throw new Error(`${exam.code}: question starts mismatch\nexpected ${expected.join(",")}\ngot      ${got.join(",")}`);
  }
  return unique;
}

function tsvWords(tsvPath) {
  const rows = fs.readFileSync(tsvPath, "utf8").split(/\r?\n/).slice(1).map((line) => line.split("\t")).filter((cols) => cols.length >= 12);
  return rows
    .map((cols) => ({
      page: Number(cols[1]),
      left: Number(cols[6]),
      top: Number(cols[7]),
      text: normalizeText(cols.slice(11).join("\t")).trim(),
    }))
    .filter((word) => word.text && !word.text.startsWith("###"));
}

function textBlocksFromTsv(tsvPath, starts, size) {
  const words = tsvWords(tsvPath);
  const texts = {};
  for (let i = 0; i < starts.length; i += 1) {
    const start = starts[i];
    const next = starts[i + 1];
    const y1pt = next && next.page === start.page ? next.y - 7 : size.height - 36;
    const inBlock = words
      .filter((word) => word.page === start.page && word.top >= start.y - 6 && word.top < y1pt)
      .sort((a, b) => a.top - b.top || a.left - b.left);
    const lines = [];
    for (const word of inBlock) {
      let line = lines.find((item) => Math.abs(item.top - word.top) < 4);
      if (!line) {
        line = { top: word.top, words: [] };
        lines.push(line);
      }
      line.words.push(word);
    }
    texts[start.id] = lines
      .sort((a, b) => a.top - b.top)
      .map((line) => line.words.sort((a, b) => a.left - b.left).map((word) => word.text).join(" "))
      .join("\n")
      .replace(/[ \t]+/g, " ")
      .trim();
  }
  return texts;
}

function blockImages(exam) {
  const examTmp = path.join(TMP, exam.subject, exam.code);
  const pagesDir = path.join(examTmp, "pages");
  const blocksDir = path.join(examTmp, "blocks");
  cleanDir(examTmp);
  fs.mkdirSync(pagesDir, { recursive: true });
  fs.mkdirSync(blocksDir, { recursive: true });

  const pdfPath = path.join(ROOT, exam.pdf);
  const size = pageSize(pdfPath);
  const pages = renderPages(exam, pagesDir);
  const tsvPath = path.join(examTmp, "starts.tsv");
  const starts = startsFromTsv(exam, pdfPath, tsvPath);
  const texts = textBlocksFromTsv(tsvPath, starts, size);
  const images = {};

  for (let i = 0; i < starts.length; i += 1) {
    const start = starts[i];
    const next = starts[i + 1];
    const pageFile = pages[start.page - 1];
    const pagePx = imageSize(pageFile);
    const sx = pagePx.width / size.width;
    const sy = pagePx.height / size.height;
    const y1pt = next && next.page === start.page ? next.y - 7 : size.height - 36;
    const x = Math.round(42 * sx);
    const y = Math.max(0, Math.round((start.y - 7) * sy));
    const width = Math.min(pagePx.width - x, Math.round((size.width - 74) * sx));
    const height = Math.max(36, Math.min(pagePx.height - y, Math.round((y1pt - start.y + 14) * sy)));
    const out = path.join(blocksDir, `${start.id}.png`);
    execFileSync("magick", [pageFile, "-crop", `${width}x${height}+${x}+${y}`, "-colorspace", "Gray", out]);
    images[start.id] = fs.readFileSync(out).toString("base64");
  }
  return { images, texts };
}

function trimSentence(text, max = 150) {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length > max ? `${clean.slice(0, max)}…` : clean;
}

function problemTopic(text) {
  const clean = text.replace(/\s+/g, " ").replace(/^[AB]-[0-9]{1,2}\s*/, "").trim();
  const match = clean.match(/^(.*?)(?:下の[0-9１-９]|このうち|□|に入れる|番号から|正しいもの|誤っているもの|適合するもの|適合しないもの)/);
  return trimSentence((match ? match[1] : clean).replace(/[、。]\s*$/, "").replace(/\s*内$/, ""), 130);
}

function citedRules(text) {
  const clean = text.replace(/\s+/g, "");
  const rulePattern = /(電波法施行規則|電波法|無線設備規則|無線局運用規則|無線局免許手続規則|無線従事者規則|無線通信規則|国際電気通信連合憲章|国際電気通信連合条約)(?:（([^）]+)）)?/g;
  const found = [...clean.matchAll(rulePattern)].map((match) => `${match[1]}${match[2] ? `（${match[2]}）` : ""}`);
  return [...new Set(found)].slice(0, 3);
}

function correctChoiceText(text, answer) {
  if (typeof answer !== "number") return "";
  const lines = text.split(/\n/).map((line) => line.trim()).filter(Boolean);
  const pattern = new RegExp(`^${answer}[\\s　]+(.+)`);
  const line = lines.find((item) => pattern.test(item));
  if (!line) return "";
  return trimSentence(line.replace(pattern, "$1"), 120);
}

function houkiRulePoint(text) {
  const clean = text.replace(/\s+/g, " ");
  const rules = [
    [/アマチュア業務|アマチュア衛星業務/, "アマチュア業務は、金銭上の利益を目的としない自己訓練・通信・技術的研究の業務です。第三者通信、商業利用、暗語の扱いを確認します。"],
    [/分配されている周波数帯|周波数帯に該当しない/, "周波数分配の問題では、無線通信規則の周波数分配表でアマチュア業務に割り当てられている帯域かどうかを確認します。似た周波数帯でも、アマチュア業務ではない帯域が選択肢に混ぜられます。"],
    [/目的及び.*定義|電波法の目的|電波の公平且つ能率的な利用/, "電波法の目的は、電波の公平かつ能率的な利用を確保し、公共の福祉を増進することです。定義問題では、電波、無線電信、無線電話、無線設備、無線局などの用語を条文どおりに区別します。"],
    [/無線局の定義|無線局の限界/, "「無線局」は、無線設備とその操作を行う者を含めた単位として扱います。ただし受信のみを目的とするものなど、法令上の除外に当たるものは無線局に含めません。"],
    [/開設|免許を受けなければ|免許を要しない|登録局/, "無線局は、原則として免許を受けなければ開設できません。例外に当たる局か、登録局か、免許局かを問題文の条件で切り分けます。"],
    [/予備免許|工事設計|設置場所の変更|工事落成|変更検査|免許後の変更/, "予備免許後や免許後の変更では、工事設計・設置場所・無線設備の変更が、許可を要する変更なのか、届出で足りる軽微な変更なのか、変更検査が必要なのかを分けて考えます。"],
    [/落成後の検査|落成検査/, "落成後の検査は、工事落成の届出後に、免許内容どおり無線設備が整っているかを確認する手続です。検査を受ける時点、検査対象、運用開始との関係が問われます。"],
    [/工事落成の期限|落成した旨の届出/, "予備免許を受けた者が指定期限後2週間以内に工事落成の届出をしない場合、総務大臣は免許を拒否できる扱いになります。期限、延長の有無、届出の有無がポイントです。"],
    [/廃止|休止|承継|免許状の返納/, "無線局を廃止したときや免許が効力を失ったときは、届出や免許状返納などの手続が問題になります。誰が、いつ、何を総務大臣に行うかを確認します。"],
    [/電波利用料/, "電波利用料は、免許人等が電波利用共益事務の費用に充てるために納めるものです。納付義務者、金額、納付時期、免除・減免の有無がポイントです。"],
    [/スプリアス発射|帯域外発射|不要発射/, "不要発射は、必要周波数帯の外側に出る発射全体を扱います。帯域外発射とスプリアス発射は、必要周波数帯からの離れ方や発生原因で区別します。"],
    [/周波数の許容偏差|占有周波数帯幅|尖\s*頭電力|平均電力|電波の型式|発射電波の占有周波数帯幅/, "電波の型式、周波数の許容偏差、占有周波数帯幅、尖頭電力、平均電力は、いずれも定義語を条文どおりに読む問題です。数値や記号だけでなく、どの信号・どの時間平均・どの帯域を指すかを確認します。"],
    [/空中線電力の許容偏差/, "空中線電力の許容偏差は、指定または表示された空中線電力から実際の電力がどの範囲までずれてよいかを定めるものです。上限側と下限側、送信設備の種類、アマチュア局に適用される範囲を確認します。"],
    [/電波の質|受信設備の条件|受信設備/, "電波の質と受信設備の条件では、周波数の偏差・占有周波数帯幅・不要発射の強度、さらに副次的に発する電波や高周波電流が他の設備に妨害を与えないことが問われます。"],
    [/安全施設|高圧電気|感電|避雷器|接地/, "安全施設では、人体への危険防止、感電防止、接地、避雷、立入制限などが問われます。対象が送信設備なのか、空中線系なのかで要求が変わります。"],
    [/周波数の安定|送信装置の周波数|送信装置|水晶発振子|変調/, "送信装置は、周波数をできる限り安定に保ち、占有周波数帯幅や許容偏差を逸脱しないようにする必要があります。水晶発振子、発振回路、変調方式、不要発射の抑制を問題文の条件に合わせて確認します。"],
    [/空中線の指向特性/, "空中線の指向特性は、主に放射方向、ビーム幅、前後比、偏波などで決まります。問題では、指向特性そのものを定める事項か、単なる設備条件かを分けます。"],
    [/混信|妨害|干渉/, "混信等の防止では、他の無線局の運用を阻害しないことが基本です。必要最小限の電力、周波数の選定、発射停止や変更命令との関係を確認します。"],
    [/擬似空中線回路/, "擬似空中線回路は、空中線を接続せずに送信設備を試験・調整するための負荷です。試験電波を空中へ発射しない趣旨なので、使用すべき場面と例外を押さえます。"],
    [/通信の原則|一般通信方法/, "無線通信は、簡潔・明瞭に行い、必要のない通信を避けるのが原則です。内容、通信時間、使用周波数を必要最小限にする趣旨を押さえます。"],
    [/呼び出|呼出し|応答|通報|反復/, "運用規則の通信手順では、呼出し、応答、通報、反復の順序と、相手局・自局の呼出符号や略符号をどのタイミングで送るかが問われます。"],
    [/略符号|モ-ルス|モールス|Ｑ符号|Q符号/, "略符号・Q符号・モールスは、意味と符号の対応を正確に覚える分野です。問題文が求める意味と、選択肢の符号が表す意味を一致させます。"],
    [/電波の発射の停止|発射を停止/, "電波の発射停止は、混信・法令違反・非常時などで総務大臣が必要と認める場合に命じられる監督措置です。命令の主体と対象を確認します。"],
    [/非常の場合の無線通信|非常通信/, "非常の場合の無線通信は、地震、台風、洪水、津波、雪害、火災、暴動その他非常の事態で、有線通信を利用できないか著しく困難な場合に、人命救助・災害救援・交通通信確保などのために行う通信です。"],
    [/虚偽の通信|罰則/, "虚偽の通信に対する罰則では、遭難通信・緊急通信・安全通信など重要通信について虚偽の通信を発した場合の重い処罰と、一般の虚偽通信の扱いを区別します。"],
    [/無線従事者|従事停止|免許の取消/, "無線従事者に対する処分では、法令違反や不正取得などに対し、免許取消しや業務従事停止があり得ます。無線局免許人への処分とは区別します。"],
    [/技術基準に適合していない|技術基準/, "無線設備が技術基準に適合していないと認められる場合、総務大臣は修理その他必要な措置を命じることができます。免許取消しではなく、まず設備を基準に適合させる監督措置として読むのがポイントです。"],
    [/制限に関する|第76条|運用の停止|周波数若しくは空中線電力/, "免許人が法令や処分に違反した場合、総務大臣は無線局の運用停止、運用許容時間・周波数・空中線電力の制限、免許取消しなどを行えます。無線従事者個人への処分と混同しないことが重要です。"],
    [/報告|事故|遭難|非常通信|業務書類/, "報告義務では、無線局の運用や設備に重大な事故・違反・非常通信などがあった場合に、誰が総務大臣へ報告するかが問われます。"],
    [/通信の秘密|秘密の保護/, "通信の秘密は、内容の漏えい・窃用・不当な利用を禁じる基本原則です。受信した通信を第三者へ漏らすこと、自己や他人の利益のために使うことは許されません。"],
    [/禁止されている伝送|すべての局に禁止/, "無線通信規則では、不要な伝送、虚偽または紛らわしい信号、識別のない伝送など、すべての局に禁止される伝送があります。禁止事項に該当するものと、該当しないものを分けて読むことが重要です。"],
    [/違反の通告|有害な混信/, "国際規則の違反通告では、有害な混信や規則違反を認めた主管庁が、関係主管庁へ必要な資料を添えて通告する流れを押さえます。"],
    [/許可書|局の許可書|免許状/, "局の許可書・免許状は、局の識別、設置場所、周波数、電力など運用条件を示す根拠書類です。備付け、提示、記載事項の扱いが問われます。"],
    [/社団.*アマチュア局|公益社団法人を除く/, "社団であるアマチュア局の免許人には、定款・役員・構成員など、社団としての実体を維持する義務があります。変更があった場合の届出や、代表者・構成員に関する要件を確認します。"],
    [/周波数測定装置/, "周波数測定装置は、送信周波数を法令上の許容偏差内に保つための設備です。備付け義務の有無と、例外に当たる条件を確認します。"],
    [/目的外使用|目的外|秘密|非常通信/, "無線局は免許された目的・通信事項・相手方の範囲で運用するのが原則です。非常通信や遭難通信など、例外的に目的外使用が認められる場合と区別します。"],
    [/免許の取消|運用停止|無線局の停止/, "無線局免許人への監督処分では、免許取消し、運用停止、周波数・電力の制限などがあります。違反の内容と処分対象を混同しないことが重要です。"],
    [/識別|呼出符号|局の識別/, "局の識別では、送信中に自局を明らかにするための呼出符号や識別信号を正しく送る必要があります。送信の始め、終わり、一定間隔での識別が論点になります。"],
  ];
  const found = rules.find(([pattern]) => pattern.test(clean));
  return found ? found[1] : "";
}

function houkiExplanation(question, sourceText) {
  const topic = problemTopic(sourceText);
  const rules = citedRules(sourceText);
  const ruleText = rules.length ? rules.join("、") : "";
  const point = houkiRulePoint(topic) || houkiRulePoint(sourceText);
  if (!topic || !point) return null;

  if (question.kind === "A") {
    const choice = correctChoiceText(sourceText, question.answer);
    const lines = [
      `この問題は、${topic}について、${ruleText || "関係法令"}に照らして正しい肢または誤っている肢を選ぶ問題です。`,
      "",
      point,
      "",
      `正答表の正解は ${question.answer} です。`,
    ];
    if (choice) {
      lines.push(`正解肢の要旨は「${choice}」です。`, "");
    } else {
      lines.push("この問題は表形式または長い選択肢のため、正解肢の全文引用ではなく、問題画像の該当番号と条文の要件を照合してください。", "");
    }
    return [
      ...lines,
      "",
      "法規問題では、似た表現でも「できる」と「しなければならない」、「総務大臣」と「免許人」、「免許」と「登録」の違いで正誤が変わります。",
      "この問題では、問題文が引用している条文の対象、義務を負う者、手続の時期、例外条件を順に確認すると、正解肢だけが条文の要件と一致します。"
    ].join("\n");
  }

  const correct = question.labels.map((label, index) => `${label}=${question.answers[index]}`).join("、");
  return [
    `このB問題は、${topic}について、${ruleText || "関係法令"}の語句や正誤を組み合わせる問題です。`,
    "",
    point,
    "",
    `正答表どおり、${correct} です。`,
    "",
    "B問題は、各空欄や各小問を独立に見るより、条文の文章全体の流れで確認すると安定します。",
    "特に、主語、義務を表す語、例外条件、期限や対象範囲を入れ替えた選択肢が誤りになりやすいので、空欄の前後の文と正答の語句をつなげて読んでください。"
  ].join("\n");
}

function kougakuCalculationExplanation(question, sourceText) {
  const text = sourceText.replace(/\s+/g, " ");
  const answerText = question.kind === "A"
    ? `正答表では${question.id}の正解は${question.answer}です。`
    : `正答表では${question.id}の正解は${question.labels.map((label, index) => `${label}=${question.answers[index]}`).join("、")}です。`;
  const topic = problemTopic(sourceText);
  const lines = [];
  function finish(items) {
    return [`この問題は「${topic}」を計算で確認する問題です。`, answerText, ...items].join("\n");
  }

  if (/変成器|巻数|インピ-ダンス整合|インピーダンス整合/.test(text)) {
    return finish([
      "理想変成器では、二次側の負荷抵抗を一次側から見ると、抵抗は巻数比の2乗で変換されます。基本式は Rab = (N1 / N2)^2 RL です。",
      "最大電力を送る条件は、電源の内部抵抗と負荷側を見た抵抗が等しいこと、つまり Rab = RG です。",
      "そのとき負荷側にかかる電圧は電源電圧の半分になり、最大電力は Pm = (V/2)^2 / RG = V^2 / (4RG) になります。"
    ]);
  }

  if (/コンデンサ|静電容量|誘電体|直列|並列/.test(text)) {
    return finish([
      "コンデンサでは Q = CV、したがって V = Q/C を使います。直列接続では各コンデンサの電荷 Q が同じになり、電圧は容量 C に反比例します。",
      "耐電圧を考える問題では、容量が小さいコンデンサほど大きい電圧を受ける点が重要です。最も厳しいコンデンサが耐電圧に達する条件から全体の最大電圧を求めます。",
      "誘電体を含む平行板コンデンサは C = εS/d を基本に、層が直列になる場合は各層の電圧分担、並列になる場合は容量の和で整理します。"
    ]);
  }

  if (/共振|RLC|リアクタンス|尖鋭度|Q|同調|コイル|インダクタンス/.test(text)) {
    return finish([
      "共振回路では XL = 2πfL、XC = 1/(2πfC) を使い、共振条件は XL = XC です。",
      "共振周波数は f0 = 1/(2π√LC) で、直列共振ではインピーダンスが最小、並列共振ではインピーダンスが最大になります。",
      "尖鋭度 Q は、回路の抵抗成分に対してリアクタンス成分がどれだけ大きいかを表す量です。問題が直列か並列かを確認して、対応する式に代入します。"
    ]);
  }

  if (/SWR|定在波比|反射波|進行波|反射係数/.test(text)) {
    return finish([
      "SWRから反射係数を求める式は |Γ| = (SWR - 1) / (SWR + 1) です。",
      "反射波電力は Pr = |Γ|^2 Pf で求めます。ここで Pf は進行波電力です。",
      "リターンロスは 10log10(Pf/Pr) = -20log10|Γ| です。SWR、反射係数、進行波/反射波電力の順に変換すると整理しやすくなります。"
    ]);
  }

  if (/dB|デシベル|減衰|利得|リタ-ンロス|リターンロス/.test(text)) {
    return finish([
      "デシベル計算では、電力比は 10log10(P2/P1)、電圧・電界・電流の比は 20log10(V2/V1) を使います。",
      "減衰量が L[dB] のとき、電力比は 10^(L/10)、電圧比は 10^(L/20) です。増幅なら掛け算、減衰なら割り算として扱います。",
      "アンテナ利得や減衰器が複数ある場合は、dB表示では足し算・引き算で合成できます。最後に必要なら真数に戻します。"
    ]);
  }

  if (/AM|A3E|変調度|平均電力|搬送波/.test(text)) {
    return finish([
      "AM波の平均電力は、搬送波電力を Pc、変調度を m とすると P = Pc(1 + m^2/2) です。",
      "変調度がパーセントで与えられているときは、80%なら m=0.8 のように小数へ直して代入します。",
      "平均電力から変調度を求める場合は、P/Pc = 1 + m^2/2 から m を逆算します。"
    ]);
  }

  if (/PLL|周波数シンセサイザ|発振器|出力周波数/.test(text)) {
    return finish([
      "PLL周波数シンセサイザでは、分周後の周波数が基準周波数と一致するように制御されます。",
      "基本は 出力周波数 = 基準周波数 × 分周比 です。途中に逓倍・分周がある場合は、その倍率を順に掛けるか割るかして整理します。",
      "ブロック図の信号の流れに沿って、比較器に入る2つの周波数が等しくなる条件を立てるのがポイントです。"
    ]);
  }

  if (/見通し距離|地上高|アンテナの高さ|VHF|UHF/.test(text)) {
    return finish([
      "VHF/UHFの見通し距離は、標準大気中では d[km] ≒ 4.12(√h1 + √h2) を使います。h1、h2 は送受信アンテナ高[m]です。",
      "片方の高さを求める場合は、d/4.12 から既知側の √h を引き、残りを2乗します。",
      "単位は km と m の組合せで使う公式なので、問題文の単位をそのまま代入できるか確認します。"
    ]);
  }

  if (/導波管|遮断周波数|TE/.test(text)) {
    return finish([
      "方形導波管のTE10波の遮断周波数は fc = c/(2a) です。c は光速 3.0×10^8[m/s]、a は長辺の長さです。",
      "a を求めるときは a = c/(2fc) と変形します。GHzは10^9Hz、cmは10^-2mに直して計算します。",
      "遮断周波数より高い周波数で伝搬できるため、まずTE10の基本式で長辺寸法を求めます。"
    ]);
  }

  if (/ビットレ-ト|ビットレート|標本化|量子化/.test(text)) {
    return finish([
      "デジタル信号のビットレートは、標本化周波数 × 1標本あたりのビット数で求めます。",
      "誤り訂正符号などの付加ビットがある場合は、量子化ビット数に付加ビット数を足してから掛けます。",
      "kHz と bit の積は kbit/s になります。必要なら最後に Mbit/s へ換算します。"
    ]);
  }

  if (/電界強度|半波長ダイポ-ル|受信機の入力端子|実効長/.test(text)) {
    return finish([
      "受信アンテナの端子電圧は、電界強度とアンテナの実効長から求めます。半波長ダイポールでは実効長を波長に比例する量として扱います。",
      "まず周波数から波長 λ = c/f を求め、実効長を使って誘起電圧を計算します。",
      "問題が受信機入力電圧を与えて電界強度を問う形なら、この関係を逆に使います。mV、μV、m の単位換算に注意します。"
    ]);
  }

  if (/整流|実効値|無負荷電圧|電源電圧/.test(text)) {
    return finish([
      "整流回路では、交流の実効値と最大値の関係 Vmax = √2 Vrms を使います。",
      "コンデンサ入力形平滑回路の無負荷電圧は、おおむね整流後のピーク値になります。全波整流や倍電圧整流では、回路構成に応じてピーク値が何個分になるかを確認します。",
      "求める値が実効値かピーク値かを取り違えないことがポイントです。"
    ]);
  }

  return null;
}

function explanation(subject, question, sourceText = "") {
  const manual = MANUAL_EXPLANATIONS[`${question.examCode}:${question.id}`];
  if (manual) return manual;
  if (subject === "houki") {
    const law = houkiExplanation(question, sourceText);
    if (law) return law;
  }
  const topic = problemTopic(sourceText);
  const correct = question.kind === "A"
    ? (question.acceptAll ? "全員正解扱い" : String(question.answer))
    : question.labels.map((label, index) => `${label}=${question.answers[index]}`).join("、");
  EXPLANATION_GAPS.push({
    subject,
    examCode: question.examCode,
    questionId: question.id,
    kind: question.kind,
    correct,
    topic,
    sourceText: trimSentence(sourceText, 240),
  });
  if (!ALLOW_MISSING_EXPLANATIONS) return null;
  return [
    "解説未対応です。",
    "",
    "この表示は汎用解説ではありません。未対応を隠さないための明示的なプレースホルダーです。",
    `対象: ${question.examCode} ${question.id}`,
    `正答表: ${correct}`,
    "",
    "この問題には、問題固有の丁寧な解説を追加する必要があります。"
  ].join("\n");
}

function questionsFor(exam, answers, images, texts) {
  const questions = [];
  answers.a.forEach((answer, index) => {
    const id = `A-${index + 1}`;
    const question = { id, examCode: exam.code, kind: "A", answer, acceptAll: answer === "*", options: [1, 2, 3, 4, 5], blockImage: images[id] };
    question.explanation = explanation(exam.subject, question, texts[id]);
    questions.push(question);
  });
  answers.b.forEach((answerSet, index) => {
    const id = `B-${index + 1}`;
    const question = {
      id,
      examCode: exam.code,
      kind: "B",
      answers: answerSet,
      options: Math.max(...answerSet) <= 2 ? [1, 2] : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      labels: ["ア", "イ", "ウ", "エ", "オ"],
      blockImage: images[id],
    };
    question.explanation = explanation(exam.subject, question, texts[id]);
    questions.push(question);
  });
  for (const question of questions) {
    if (!question.blockImage) throw new Error(`${exam.code} ${question.id}: block image missing`);
  }
  return questions;
}

function htmlFor(exam, questions) {
  return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>一アマ ${exam.label} ${exam.title}</title>
<style>
:root{--bg:#0b1020;--panel:#111827;--panel2:#182235;--line:#2b3a5c;--text:#e5edf8;--muted:#9aa8bd;--accent:#38bdf8;--ok:#22c55e;--bad:#ef4444}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--text);font-family:-apple-system,BlinkMacSystemFont,"Noto Sans JP","Segoe UI",sans-serif}header{position:sticky;top:0;background:rgba(11,16,32,.96);border-bottom:1px solid var(--line);z-index:2}.top{max-width:1600px;margin:0 auto;padding:12px 20px;display:flex;gap:12px;align-items:center;justify-content:space-between;flex-wrap:wrap}h1{font-size:18px;margin:0}.nav{display:flex;gap:8px;flex-wrap:wrap}button,a{border:1px solid var(--line);background:#172033;color:var(--text);border-radius:8px;padding:10px 14px;font-weight:700;text-decoration:none}.danger{background:#3b1111}.active,.chip.current{border-color:var(--accent);background:#075985}.wrap{max-width:1600px;margin:0 auto;padding:18px 20px}.summary{border:1px solid var(--line);background:var(--panel);border-radius:8px;padding:14px 18px;margin-bottom:16px}.summary strong{font-size:18px}.muted{color:var(--muted)}.chips{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px}.chip{width:58px}.chip.done{border-color:var(--ok)}.chip.wrong{border-color:var(--bad);background:#3b1d1d}.card{border:1px solid var(--line);background:var(--panel);border-radius:8px;padding:18px;margin-bottom:16px}.qhead{display:flex;justify-content:space-between;color:var(--muted);font-weight:700;font-size:18px}.qimg{display:block;width:100%;height:auto;background:white;border-radius:6px;margin-top:14px}.answers{display:grid;grid-template-columns:repeat(auto-fit,minmax(84px,1fr));gap:8px;margin-top:12px}.ans{padding:12px;font-size:16px}.ans:hover,.move:hover{border-color:var(--accent)}.ans.correct{background:#14532d;border-color:var(--ok)}.ans.selected.ok{background:#14532d;border-color:var(--ok)}.ans.selected.bad{background:#581c1c;border-color:var(--bad)}.sub{border-top:1px solid var(--line);padding-top:12px;margin-top:12px}.sub-title{font-weight:700;margin-bottom:8px}.result{padding:12px;border-radius:7px;margin-top:12px;border:1px solid var(--line);line-height:1.75}.result.ok{background:rgba(34,197,94,.12);border-color:var(--ok)}.result.bad{background:rgba(239,68,68,.12);border-color:var(--bad)}.explain{margin-top:12px;color:var(--text);white-space:pre-wrap;line-height:1.85}.foot-actions{display:flex;gap:8px;flex-wrap:wrap}
@media(max-width:640px){header{position:static}.wrap{padding:10px}.card{padding:12px}.chip{width:44px}.answers{grid-template-columns:repeat(5,1fr)}.ans{padding:10px 6px}}
</style>
</head>
<body>
<header><div class="top"><h1>一アマ ${exam.label} ${exam.title}（${exam.code}）</h1><div class="nav"><a href="index.html">メニュー</a><button id="reviewBtn">間違い復習</button><button id="allBtn" class="active">全問</button><button id="resetBtn" class="danger">記録リセット</button></div></div></header>
<main class="wrap">
  <div class="summary"><strong>${exam.title} / 回答済み <span id="done">0</span> / ${questions.length} 問、苦手 <span id="wrong">0</span> 問</strong><div class="muted">問題は1問ずつPDFから切り出して表示します。回答ボタンと記録はこのページで処理します。</div></div>
  <div class="chips" id="chips"></div>
  <section class="card"><div class="qhead"><span id="qid"></span><span id="pos"></span></div><div id="qbody"></div><div id="answers"></div><div id="result"></div></section>
  <div class="foot-actions"><button class="move" id="prevBtn">前へ</button><button class="move" id="nextBtn">次へ</button></div>
</main>
<script>
const EXAM=${JSON.stringify({ id: exam.id, code: exam.code, title: exam.title, subject: exam.subject })};
const QUESTIONS=${JSON.stringify(questions)};
const STORE_KEY="ama1_"+EXAM.subject+"_"+EXAM.code+"_"+(EXAM.subject==="kougaku"?"v4":"v1");
let state={answers:{},wrong:{},current:0,review:false};
try{const saved=localStorage.getItem(STORE_KEY);if(saved)state={...state,...JSON.parse(saved)}}catch(e){throw new Error("localStorage parse failed: "+STORE_KEY)}
function save(){localStorage.setItem(STORE_KEY,JSON.stringify(state))}
function activeQuestions(){return state.review?QUESTIONS.filter(q=>state.wrong[q.id]):QUESTIONS}
function currentQuestion(){const list=activeQuestions();if(!list.length)return null;if(state.current>=list.length)state.current=list.length-1;if(state.current<0)state.current=0;return list[state.current]}
function isAnswered(q){return q.kind==="A"?state.answers[q.id]!==undefined:q.labels.every(l=>(state.answers[q.id]||{})[l]!==undefined)}
function updateSummary(){document.getElementById("done").textContent=QUESTIONS.filter(isAnswered).length;document.getElementById("wrong").textContent=Object.keys(state.wrong).length}
function renderChips(){const chips=document.getElementById("chips");chips.innerHTML="";QUESTIONS.forEach(q=>{const b=document.createElement("button");b.className="chip";b.textContent=q.id;if(q===currentQuestion())b.classList.add("current");if(isAnswered(q))b.classList.add("done");if(state.wrong[q.id])b.classList.add("wrong");b.onclick=()=>{state.review=false;state.current=QUESTIONS.indexOf(q);save();render()};chips.appendChild(b)})}
function renderA(q){const wrap=document.createElement("div");wrap.className="answers";const saved=state.answers[q.id];const answered=saved!==undefined;q.options.forEach(n=>{const b=document.createElement("button");b.className="ans";b.textContent=n;if(answered&&(q.acceptAll||n===q.answer))b.classList.add("correct");if(saved===n)b.classList.add("selected",(q.acceptAll||n===q.answer)?"ok":"bad");b.onclick=()=>answerA(q,n);wrap.appendChild(b)});return wrap}
function renderB(q){const outer=document.createElement("div");q.labels.forEach((label,idx)=>{const row=document.createElement("div");row.className="sub";const title=document.createElement("div");title.className="sub-title";title.textContent=label;row.appendChild(title);const ans=document.createElement("div");ans.className="answers";const saved=(state.answers[q.id]||{})[label];q.options.forEach(n=>{const b=document.createElement("button");b.className="ans";b.textContent=n;if(saved!==undefined&&n===q.answers[idx])b.classList.add("correct");if(saved===n)b.classList.add("selected",n===q.answers[idx]?"ok":"bad");b.onclick=()=>answerB(q,label,idx,n);ans.appendChild(b)});row.appendChild(ans);outer.appendChild(row)});return outer}
function answerA(q,n){state.answers[q.id]=n;if(q.acceptAll||n===q.answer)delete state.wrong[q.id];else state.wrong[q.id]=true;save();render()}
function answerB(q,label,idx,n){state.answers[q.id]=state.answers[q.id]||{};state.answers[q.id][label]=n;const all=q.labels.every((l,i)=>(state.answers[q.id]||{})[l]===q.answers[i]);const anyWrong=q.labels.some((l,i)=>state.answers[q.id]?.[l]!==undefined&&state.answers[q.id][l]!==q.answers[i]);if(all)delete state.wrong[q.id];else if(anyWrong)state.wrong[q.id]=true;save();render()}
function showResult(ok,msg,explanation){const r=document.getElementById("result");r.className="result "+(ok?"ok":"bad");r.innerHTML="";const p=document.createElement("div");p.textContent=msg;r.appendChild(p);const e=document.createElement("div");e.className="explain";e.textContent=explanation;r.appendChild(e)}
function renderStoredResult(q){const r=document.getElementById("result");r.className="";r.textContent="";if(q.kind==="A"){const saved=state.answers[q.id];if(saved===undefined)return;if(q.acceptAll){showResult(true,"この問題は公式に全員正解です。選択した番号: "+saved,q.explanation);return}const ok=saved===q.answer;showResult(ok,(ok?"正解です。":"不正解です。")+"正答表の正解は "+q.answer+" です。",q.explanation)}else{const saved=state.answers[q.id]||{};const answered=q.labels.filter(l=>saved[l]!==undefined);if(!answered.length)return;const wrong=q.labels.filter((l,i)=>saved[l]!==undefined&&saved[l]!==q.answers[i]);const ok=answered.length===q.labels.length&&wrong.length===0;const correct=q.labels.map((l,i)=>l+"="+q.answers[i]).join("、");const selected=answered.map(l=>l+"="+saved[l]).join("、");showResult(ok,((ok?"正解です。":wrong.length?"不正解があります。":"回答途中です。")+" 選択: "+selected+" / 正答表: "+correct),q.explanation);}}
function render(){updateSummary();renderChips();const q=currentQuestion();document.getElementById("qid").textContent=q?q.id:(state.review?"間違いはありません":"");document.getElementById("pos").textContent=q?(state.current+1)+" / "+activeQuestions().length:"";const body=document.getElementById("qbody");const ans=document.getElementById("answers");body.innerHTML="";ans.innerHTML="";document.getElementById("result").textContent="";if(!q)return;const img=document.createElement("img");img.className="qimg";img.alt=q.id;img.src="data:image/png;base64,"+q.blockImage;body.appendChild(img);ans.appendChild(q.kind==="A"?renderA(q):renderB(q));renderStoredResult(q)}
document.getElementById("prevBtn").onclick=()=>{state.current-=1;save();render()};
document.getElementById("nextBtn").onclick=()=>{state.current+=1;save();render()};
document.getElementById("reviewBtn").onclick=()=>{state.review=true;state.current=0;save();render()};
document.getElementById("allBtn").onclick=()=>{state.review=false;state.current=0;save();render()};
document.getElementById("resetBtn").onclick=()=>{if(confirm("この年度の回答記録をリセットしますか？")){state={answers:{},wrong:{},current:0,review:false};save();render()}};
render();
</script>
</body>
</html>`;
}

function cardHtml(exam, total) {
  return `      <a href="${exam.out}" class="card ${exam.subject === "kougaku" ? "kougaku" : "houki-card"}" data-progress-subject="${exam.subject}" data-progress-code="${exam.code}" data-progress-total="${total}">
        <div class="card-label">${exam.code}</div>
        <div class="card-title">${exam.title}</div>
        <div class="card-sub">${exam.subject === "houki" ? "A問題24問 ／ B問題6問" : "A問題25問 ／ B問題5問"}</div>
        <div class="card-progress" data-progress>0/${total} ☑ 0 ❌ 0</div>
      </a>`;
}

function indexHtml(houki, kougaku) {
  return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>一アマ 過去問練習</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Noto+Serif+JP:wght@400;700&family=Share+Tech+Mono&display=swap');
:root{--bg:#0a0e1a;--surface:#111827;--border:#2a3a5c;--accent:#00d4ff;--accent2:#ff6b35;--text:#e2e8f0;--muted:#64748b}
*{box-sizing:border-box;margin:0;padding:0}body{background:var(--bg);color:var(--text);font-family:'Noto Serif JP',serif;min-height:100vh}body::before{content:'';position:fixed;inset:0;background-image:linear-gradient(rgba(0,212,255,.03) 1px,transparent 1px),linear-gradient(90deg,rgba(0,212,255,.03) 1px,transparent 1px);background-size:40px 40px;pointer-events:none}.container{max-width:1250px;margin:0 auto;padding:32px 24px;position:relative}.header{text-align:center;margin-bottom:28px;padding:28px 24px;background:linear-gradient(135deg,#0f172a,#1e293b);border:1px solid var(--border);border-radius:14px}.badge{display:inline-block;font-family:'Share Tech Mono',monospace;font-size:11px;color:var(--accent);letter-spacing:3px;border:1px solid var(--accent);padding:3px 12px;margin-bottom:12px}.header h1{font-size:clamp(18px,4vw,26px);line-height:1.3;margin-bottom:6px}.header-sub{font-size:12px;color:var(--muted);font-family:'Share Tech Mono',monospace}.section{margin-bottom:26px}.section-title{font-family:'Share Tech Mono',monospace;font-size:12px;color:var(--muted);letter-spacing:2px;margin-bottom:12px;padding-bottom:6px;border-bottom:1px solid var(--border)}.card-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:14px}.card{display:block;padding:18px 20px;background:var(--surface);border:1px solid var(--border);border-radius:10px;text-decoration:none;color:var(--text);transition:all .2s}.card:hover{border-color:var(--accent);transform:translateY(-2px)}.card.kougaku:hover{border-color:var(--accent2)}.card-label{font-family:'Share Tech Mono',monospace;font-size:10px;color:var(--muted);letter-spacing:1px;margin-bottom:4px}.card-title{font-size:16px;font-weight:700;color:#fff;margin-bottom:8px}.card-sub{display:none}.card-progress{font-family:'Share Tech Mono',monospace;font-size:12px;color:#fff}.footer{text-align:center;margin-top:32px;font-family:'Share Tech Mono',monospace;font-size:11px;color:var(--muted)}@media(max-width:720px){.container{padding:24px 14px}.card-grid{grid-template-columns:1fr;gap:12px}.card{padding:18px 20px}}
</style>
</head>
<body><div class="container"><div class="header"><div class="badge">1st CLASS AMATEUR RADIO</div><h1>第一級アマチュア無線技士<br>過去問練習アプリ</h1><div class="header-sub">令和3年4月期〜令和7年5月期 ／ 法規・無線工学</div></div>
<div class="section"><div class="section-title">📋 法規</div><div class="card-grid">
${houki.map((exam) => cardHtml(exam, 30)).join("\n")}
</div></div>
<div class="section"><div class="section-title">📡 無線工学</div><div class="card-grid">
${kougaku.map((exam) => cardHtml(exam, 30)).join("\n")}
</div></div>
<div class="footer">回答の進捗はブラウザのlocalStorageに保存されます。<br>キャッシュクリアや別端末では引き継がれません。</div></div>
${progressScript()}
</body></html>`;
}

function houkiMenuHtml(houki) {
  return `<!DOCTYPE html>
<html lang="ja"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>一アマ 法規</title><style>
@import url('https://fonts.googleapis.com/css2?family=Noto+Serif+JP:wght@400;700&family=Share+Tech+Mono&display=swap');
:root{--bg:#0a0e1a;--surface:#111827;--border:#2a3a5c;--accent:#00d4ff;--text:#e2e8f0;--muted:#94a3b8}*{box-sizing:border-box;margin:0;padding:0}body{min-height:100vh;background:var(--bg);color:var(--text);font-family:'Noto Serif JP',serif}.container{max-width:1250px;margin:0 auto;padding:32px 24px}.top{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:20px}h1{font-size:clamp(22px,5vw,32px)}.menu{display:inline-flex;align-items:center;justify-content:center;min-height:44px;padding:0 16px;border:1px solid var(--border);border-radius:8px;background:#172033;color:var(--text);text-decoration:none;font-weight:700}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:14px}.card{display:block;padding:18px 20px;border:1px solid var(--border);border-radius:10px;background:var(--surface);color:var(--text);text-decoration:none;transition:all .2s}.card:hover{border-color:var(--accent);transform:translateY(-2px)}.code{font-family:'Share Tech Mono',monospace;font-size:12px;color:var(--accent);letter-spacing:1px;margin-bottom:4px}.title{font-size:16px;font-weight:700;margin-bottom:8px}.sub{display:none}.progress{font-family:'Share Tech Mono',monospace;font-size:14px;color:#fff}@media(max-width:720px){.container{padding:24px 14px}.grid{grid-template-columns:1fr;gap:12px}.card{padding:18px 20px}}
</style></head><body><div class="container"><div class="top"><h1>法規</h1><a class="menu" href="index.html">メニュー</a></div><div class="grid">
${houki.map((exam) => `    <a href="${exam.out}" class="card" data-progress-code="${exam.code}" data-progress-total="30"><div class="code">${exam.code}</div><div class="title">${exam.title}</div><div class="sub">A問題24問 ／ B問題6問</div><div class="progress" data-progress>0/30 ☑ 0 ❌ 0</div></a>`).join("\n")}
</div></div>
${progressScript("houkiOnly")}
</body></html>`;
}

function progressScript(mode = "all") {
  if (mode === "houkiOnly") {
    return `<script>
function readJson(key){const raw=localStorage.getItem(key);if(!raw)return null;return JSON.parse(raw)}
function isAnswered(value){if(value==null)return false;if(typeof value==='object')return Object.keys(value).length>0;return true}
function stats(code,total){const state=readJson(\`ama1_houki_\${code}_v1\`);if(!state||!state.answers)return{answered:0,correct:0,wrong:0,total};const answered=Object.values(state.answers).filter(isAnswered).length;const wrong=state.wrong?Object.keys(state.wrong).length:0;return{answered,correct:Math.max(0,answered-wrong),wrong,total}}
document.querySelectorAll('[data-progress-code]').forEach(card=>{const s=stats(card.dataset.progressCode,Number(card.dataset.progressTotal));card.querySelector('[data-progress]').textContent=\`\${s.answered}/\${s.total} ☑ \${s.correct} ❌ \${s.wrong}\`});
</script>`;
  }
  return `<script>
function readJson(key){const raw=localStorage.getItem(key);if(!raw)return null;return JSON.parse(raw)}
function isAnswered(value){if(value==null)return false;if(typeof value==='object')return Object.keys(value).length>0;return true}
function stats(subject,code,total){const version=subject==='kougaku'?'v4':'v1';const state=readJson(\`ama1_\${subject}_\${code}_\${version}\`);if(!state||!state.answers)return{answered:0,correct:0,wrong:0,total};const answered=Object.values(state.answers).filter(isAnswered).length;const wrong=state.wrong?Object.keys(state.wrong).length:0;return{answered,correct:Math.max(0,answered-wrong),wrong,total}}
document.querySelectorAll('[data-progress-subject]').forEach(card=>{const s=stats(card.dataset.progressSubject,card.dataset.progressCode,Number(card.dataset.progressTotal));card.querySelector('[data-progress]').textContent=\`\${s.answered}/\${s.total} ☑ \${s.correct} ❌ \${s.wrong}\`});
</script>`;
}

function writeExplanationGapReport() {
  const bySubject = EXPLANATION_GAPS.reduce((acc, gap) => {
    acc[gap.subject] = (acc[gap.subject] || 0) + 1;
    return acc;
  }, {});
  fs.writeFileSync(
    path.join(ROOT, "explanation_gaps.json"),
    `${JSON.stringify({ total: EXPLANATION_GAPS.length, bySubject, gaps: EXPLANATION_GAPS }, null, 2)}\n`
  );
  const lines = [
    "# 解説未対応一覧",
    "",
    "汎用フォールバックで隠さず、問題固有の解説が未登録のものを列挙しています。",
    "",
    `- total: ${EXPLANATION_GAPS.length}`,
    ...Object.entries(bySubject).map(([subject, count]) => `- ${subject}: ${count}`),
    "",
    "| subject | exam | question | kind | correct | topic |",
    "| --- | --- | --- | --- | --- | --- |",
    ...EXPLANATION_GAPS.map((gap) => `| ${gap.subject} | ${gap.examCode} | ${gap.questionId} | ${gap.kind} | ${String(gap.correct).replace(/\|/g, "/")} | ${gap.topic.replace(/\|/g, "/")} |`),
    "",
  ];
  fs.writeFileSync(path.join(ROOT, "explanation_gaps.md"), `${lines.join("\n")}\n`);
}

function main() {
  cleanDir(TMP);
  const houki = examsFor("houki");
  const kougaku = examsFor("kougaku");
  for (const exam of [...houki, ...kougaku]) {
    for (const file of [exam.pdf, exam.answerPdf]) {
      if (!fs.existsSync(path.join(ROOT, file))) throw new Error(`${exam.code}: missing ${file}`);
    }
    const answers = parseAnswers(exam);
    const blocks = blockImages(exam);
    const beforeGaps = EXPLANATION_GAPS.length;
    const questions = questionsFor(exam, answers, blocks.images, blocks.texts);
    const examGapCount = EXPLANATION_GAPS.length - beforeGaps;
    if (examGapCount && !ALLOW_MISSING_EXPLANATIONS) {
      console.log(`${exam.out}: ${questions.length} questions, explanation gaps ${examGapCount}; skipped html write`);
    } else {
      fs.writeFileSync(path.join(ROOT, exam.out), htmlFor(exam, questions));
      console.log(`${exam.out}: ${questions.length} questions`);
    }
  }
  writeExplanationGapReport();
  if (EXPLANATION_GAPS.length && !ALLOW_MISSING_EXPLANATIONS) {
    throw new Error(`explanation gaps remain: ${EXPLANATION_GAPS.length}. See explanation_gaps.md`);
  }
  fs.writeFileSync(path.join(ROOT, "index.html"), indexHtml(houki, kougaku));
  fs.writeFileSync(path.join(ROOT, "houki.html"), houkiMenuHtml(houki));
}

main();
