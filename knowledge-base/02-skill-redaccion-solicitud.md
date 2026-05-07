# Skill de Redacción — Solicitud de Acceso y Explicación de Decisión Automatizada

## Propósito

Este skill genera la solicitud formal que el ciudadano enviará al banco que le denegó un crédito mediante decisión algorítmica. El documento solicita:

1. **Acceso a datos personales** (Art. 5°, Ley 19.628): información sobre los datos tratados, su origen, finalidades, destinatarios, periodo de tratamiento y la lógica del algoritmo aplicado (letra f).
2. **Explicación de la decisión automatizada** (Art. 8° bis, Ley 19.628): las 5 salvaguardas que la ley garantiza incluso cuando la decisión se adopta en el marco de un contrato.
3. **Finalidad del tratamiento de datos económicos** (Ley 20.575): si los datos económicos del titular fueron usados exclusivamente para evaluación de riesgo comercial.

**Este skill NO redacta demandas, querellas ni escritos judiciales.**

---

## Cuándo se invoca

El agente principal invoca este skill después de:
1. Completar el diagnóstico (Paso 2 del flujo conversacional)
2. Confirmar con el usuario que quiere enviar la solicitud
3. Recopilar los datos mínimos del titular

---

## Inputs requeridos

| Campo | Obligatorio | Fuente | Ejemplo |
|-------|-------------|--------|---------|
| `nombre_titular` | Sí | Usuario | "María Paz González Soto" |
| `rut_titular` | Sí | Usuario | "12.345.678-9" |
| `email_titular` | Sí | Usuario | "maria.gonzalez@correo.cl" |
| `domicilio_titular` | No | Usuario | "Av. Providencia 1234, Santiago" |
| `nombre_banco` | Sí | Diagnóstico | "Banco de Chile" |
| `canal_datos_banco` | Preferible | Diagnóstico o usuario | "protecciondatos@bancochile.cl" |
| `fecha_decision` | Sí | Carta o usuario | "15 de abril de 2026" |
| `tipo_credito` | Sí | Diagnóstico | "crédito de consumo" / "crédito hipotecario" / "tarjeta de crédito" |
| `monto_solicitado` | No | Usuario | "$2.000.000" |
| `hechos` | Sí | Diagnóstico (resumen estructurado) | "Solicité crédito de consumo por $5M, fue rechazado sin explicación detallada." |
| `indicios_automatizacion` | Sí | Diagnóstico | "La carta no menciona revisión humana, usa lenguaje de 'sistema de evaluación'." |
| `texto_carta_original` | No | Usuario | Texto íntegro de la carta de rechazo |

Si falta un campo obligatorio, el skill lo marca como `[POR COMPLETAR]` y advierte al usuario que debe llenarlo antes de enviar.

---

## Estructura del Documento

### ENCABEZADO

```
SOLICITUD DE ACCESO A DATOS PERSONALES Y
EXPLICACIÓN DE DECISIÓN AUTOMATIZADA
Artículos 5° y 8° bis, Ley N° 19.628

[Ciudad], [fecha de hoy en formato "6 de mayo de 2026"]
```

### DESTINATARIO

```
SEÑORES
[nombre_banco]
[canal_datos_banco — o "Departamento de Protección de Datos Personales" si no se conoce]
Presente
```

### SECCIÓN I — INDIVIDUALIZACIÓN DEL SOLICITANTE

```
Yo, [nombre_titular], cédula de identidad N° [rut_titular], domiciliado/a
en [domicilio_titular / "según consta en los registros de esa institución"],
correo electrónico [email_titular], en ejercicio de los derechos que me
confiere la Ley N° 19.628 sobre Protección de los Datos Personales, vengo
en formular la siguiente solicitud.
```

### SECCIÓN II — HECHOS

```
PRIMERO: Con fecha [fecha_decision], esa institución me comunicó la decisión
de denegar mi solicitud de [tipo_credito][, por un monto de [monto_solicitado]],
según consta en [la comunicación / carta / correo electrónico] que recibí en
dicha oportunidad.

SEGUNDO: La comunicación recibida [describir según los hechos:
- no indica las razones específicas de la decisión / o
- se limita a señalar que "no cumple con la política de riesgo" sin mayor detalle / o
- no menciona si la decisión fue adoptada con intervención de una persona natural].

TERCERO: [Si hay indicios de automatización]: La forma y contenido de la
comunicación presentan indicios de que la decisión fue adoptada total o
parcialmente mediante un sistema automatizado de evaluación o elaboración
de perfiles de riesgo, en los términos del artículo 8° bis de la Ley N° 19.628.
```

### SECCIÓN III — FUNDAMENTO LEGAL

```
En virtud de lo expuesto, fundo esta solicitud en las siguientes disposiciones
legales:

I. DERECHO DE ACCESO A DATOS PERSONALES

El artículo 5° de la Ley N° 19.628 (idNorma BCN: 141599) establece que el
titular de datos tiene derecho a solicitar y obtener del responsable,
confirmación acerca de si los datos personales que le conciernen están siendo
tratados por él, y en tal caso, acceder a dichos datos y a la siguiente
información:

  a) Los datos tratados y su origen.
  b) La finalidad o finalidades del tratamiento.
  c) Las categorías, clases o tipos de destinatarios a los que se les hayan
     comunicado o cedido los datos.
  d) El período de tiempo durante el cual los datos serán tratados.
  e) Los intereses legítimos del responsable, cuando el tratamiento se base
     en el artículo 13 letra d).
  f) La información significativa sobre la lógica aplicada en el caso de que
     el responsable realice tratamiento de datos de conformidad con el
     artículo 8° bis.

El responsable siempre estará obligado a entregar información y a dar acceso
a los datos solicitados excepto cuando una ley disponga expresamente lo
contrario.

II. DERECHO A EXPLICACIÓN DE DECISIÓN AUTOMATIZADA

El artículo 8° bis de la Ley N° 19.628 establece que el titular tiene derecho
a oponerse y a no ser objeto de decisiones basadas en el tratamiento
automatizado de sus datos personales, incluida la elaboración de perfiles,
que produzca efectos jurídicos en él o le afecte significativamente.

Asimismo, el inciso final de dicho artículo dispone que en todos los casos
de decisiones basadas en el tratamiento automatizado de datos personales
—inclusive aquéllos señalados en las excepciones de las letras a), b) y c)—
el responsable deberá adoptar las medidas necesarias para asegurar los
derechos y libertades del titular, su derecho a la información y transparencia,
el derecho a obtener una explicación, a la intervención humana, a expresar su
punto de vista y a solicitar la revisión de la decisión.

III. PRINCIPIO DE FINALIDAD EN DATOS ECONÓMICOS

Conforme al artículo 1° de la Ley N° 20.575 (idNorma BCN: 1037366), el
tratamiento de datos personales relativos a obligaciones de carácter económico,
financiero, bancario o comercial debe respetar el principio de finalidad,
siendo este exclusivamente la evaluación de riesgo comercial y el proceso de
crédito. Cualquier tratamiento que exceda esta finalidad contraviene la
legislación vigente.

IV. DERECHO A INFORMACIÓN COMO CONSUMIDOR

En mi calidad de consumidor conforme a la Ley N° 19.496 (idNorma BCN: 61438),
invoco el derecho a una información veraz y oportuna sobre las condiciones de
los servicios financieros ofrecidos (Art. 3° letra b). La denegación de un
crédito constituye una decisión sobre un servicio solicitado, y tengo derecho
a conocer los motivos de dicha denegación. A mayor abundamiento, la Circular
Interpretativa N° 33/2022 de SERNAC ha determinado que los datos sobre
comportamientos, preferencias o hábitos recolectados mediante inteligencia
artificial son considerados datos sensibles, lo que refuerza el deber de
información y protección que asiste a esa entidad en el tratamiento de mis
datos personales.

V. ALCANCE DE ESTA SOLICITUD

Se deja constancia de que esta solicitud NO requiere la divulgación de
algoritmos propietarios, código fuente, pesos específicos de modelos ni
información que constituya secreto comercial de esa entidad. Lo que se
solicita, conforme a los artículos 5° y 8° bis de la Ley N° 19.628, es:
(a) conocer qué datos personales del titular fueron utilizados, de dónde
provienen, con qué propósito se almacenan y a quiénes fueron comunicados;
y (b) obtener una explicación significativa de la lógica aplicada en la
decisión automatizada y las variables del titular que incidieron en ella,
lo cual constituye información sobre el tratamiento de datos personales
del titular, no sobre la propiedad intelectual del responsable.
```

> NOTA PARA EL AGENTE: La sección V (neutralización de secreto comercial) siempre se incluye cuando hay indicios de automatización. Previene la evasiva más común de los bancos.

### SECCIÓN IV — PETICIÓN CONCRETA

```
Por lo expuesto, solicito formalmente a esa entidad:

1. Se me proporcione la información contemplada en el artículo 5° de la
   Ley N° 19.628, incluyendo los datos personales míos que fueron
   considerados en la evaluación que derivó en la denegación de
   [tipo_credito] comunicada con fecha [fecha_decision], su origen,
   finalidades del tratamiento, destinatarios, periodo de tratamiento
   y, en particular, la información significativa sobre la lógica
   aplicada conforme a la letra f) de dicho artículo.

2. Se me informe si la decisión de denegar mi solicitud de [tipo_credito]
   fue adoptada total o parcialmente por un sistema automatizado,
   algoritmo o modelo de scoring, en los términos del artículo 8° bis.

3. En caso afirmativo, se me proporcione una explicación de la decisión
   conforme al inciso final del artículo 8° bis, incluyendo las variables,
   criterios o factores del titular que fueron considerados, y si se
   utilizaron datos provenientes de fuentes externas (registros de
   morosidad, bureaus de crédito u otros).

4. Se me informe si existió intervención de una persona natural en la
   revisión de la decisión antes de su comunicación, conforme a las
   salvaguardas del artículo 8° bis.

5. Se me indique si la decisión es susceptible de revisión y, en caso
   afirmativo, el procedimiento para solicitarla conforme al artículo
   8° bis inciso final.

6. Se me responda por escrito al correo electrónico [email_titular].

Hago presente que, conforme a los artículos 5° y 10 de la Ley N° 19.628,
la información solicitada y el ejercicio de los derechos de acceso son
gratuitos para el titular, al menos trimestralmente.
```

### SECCIÓN V — PLAZO Y ADVERTENCIA LEGAL

```
De conformidad con el artículo 11 de la Ley N° 19.628, esa entidad dispone
de un plazo de treinta días corridos desde la recepción de esta solicitud
para pronunciarse. Dicho plazo podrá prorrogarse, por una sola vez, hasta
por treinta días corridos adicionales.

En caso de denegación total o parcial, el artículo 11 obliga al responsable
a fundar su decisión indicando la causa invocada y los antecedentes que la
justifican, y a informar al titular que dispone de un plazo de treinta días
hábiles para formular una reclamación ante la Agencia de Protección de Datos
Personales, de acuerdo con el procedimiento del artículo 41.

Hago presente que la falta de respuesta dentro del plazo legal o la respuesta
insuficiente habilitará el ejercicio directo de la reclamación ante la Agencia,
conforme al inciso correspondiente del artículo 11.

Asimismo, informo que el incumplimiento del deber de responder oportunamente
las solicitudes formuladas por el titular constituye una infracción a la
Ley N° 19.628, de conformidad con el artículo 34 bis letra c).
```

> NOTA PARA EL AGENTE: Al entregar el documento, explica al ciudadano que la Sección V informa al banco que el ciudadano conoce sus derechos y los plazos legales. No es una amenaza. Es información legal que el banco ya debería conocer.

### SECCIÓN VI — CIERRE

```
Sin otro particular, saluda atentamente,


______________________________
[nombre_titular]
Cédula de identidad N° [rut_titular]
Correo electrónico: [email_titular]
```

### PIE OBLIGATORIO (generado por el agente)

```
————————————————————————————————————————
Documento generado con asistencia de inteligencia artificial (Proyecto Clarita).
Fuentes legales verificadas:
• Ley N° 19.628, Arts. 5°, 8° bis, 10, 11, 14 ter — https://www.bcn.cl/leychile/navegar?idNorma=141599
• Ley N° 20.575, Art. 1 — https://www.bcn.cl/leychile/navegar?idNorma=1037366
• Ley N° 19.496, Art. 3° letra b) — https://www.bcn.cl/leychile/navegar?idNorma=61438
• Circular Interpretativa SERNAC N° 33/2022 — datos de IA como sensibles

ADVERTENCIA: Este documento NO constituye asesoría jurídica. Se recomienda
revisarlo y, si tiene dudas, consultar con un abogado antes de enviarlo.
————————————————————————————————————————
```

---

## Reglas de Redacción

1. **Tono**: Formal, respetuoso, firme. Es un ejercicio de derechos, no una amenaza ni un reclamo emocional. No usar exclamaciones, no apelar a emociones.

2. **Precisión legal**: Solo citar artículos que existen en la Ley 19.628 vigente (modificada por Ley 21.719). Los artículos 5°, 8° bis, 10, 11, 14 ter, 15 ter, 34 bis, 41 son todos vigentes y exigibles.

3. **Plazos**: El plazo de respuesta es 30 días corridos (Art. 11), prorrogable una vez por 30 días más. Usar estos plazos exactos. No inventar otros.

4. **Lenguaje ciudadano-formal**: La persona que firma no es necesariamente abogada. El lenguaje debe ser jurídicamente correcto pero comprensible para un ciudadano que lee el documento antes de firmarlo.

5. **Citation gate**: Cada ley citada debe incluir su idNorma BCN en el pie del documento. Cada artículo citado debe existir en la base de conocimiento normativa.

6. **Campos incompletos**: Si falta un dato obligatorio, marcarlo como `[POR COMPLETAR — indicar tu nombre/RUT/etc.]` y advertir al usuario que debe llenarlo.

7. **No adivinar datos**: NUNCA inventar el nombre del banco, su dirección de protección de datos, ni datos del titular. Si no se proporcionaron, dejar en blanco con marcador.

8. **Adaptación al caso**: El esqueleto es fijo pero los hechos (Sección II) y la petición (Sección IV) se adaptan a cada caso concreto. Si el usuario describió hechos específicos, incluirlos.

9. **Coherencia de género**: Usar "domiciliado/a" o detectar el género del nombre y concordar. En caso de duda, usar formas inclusivas con barra (domiciliado/a). Revisar todo el documento por concordancia.

---

## Checklist de Calidad

Ejecutar mentalmente ANTES de entregar el documento al usuario. Si cualquier ítem falla, corregir antes de entregar.

| # | Verificación | Criterio |
|---|-------------|----------|
| 1 | Campos completos | ¿Todos los campos obligatorios están completos o marcados `[POR COMPLETAR]`? |
| 2 | Artículos correctos | ¿Se cita Art. 5° para acceso (NO Art. 12, que es consentimiento)? ¿Se cita Art. 8° bis para decisiones automatizadas? |
| 3 | Plazo correcto | ¿Se cita 30 días corridos del Art. 11? |
| 4 | Recurso correcto | ¿Se menciona la Agencia de Protección de Datos (Art. 41) como recurso? |
| 5 | Pie con fuentes | ¿El documento incluye el pie con URLs BCN y disclaimer? |
| 6 | Sin "ARCO+" | ¿NO se usa la terminología "ARCO+" en ninguna parte del documento? |
| 7 | Tono adecuado | ¿El tono es formal, respetuoso y ciudadano — no amenazante ni emocional? |
| 8 | Petición concreta | ¿La petición es clara, específica y enumera exactamente qué se solicita? |
| 9 | Gratuidad | ¿Se menciona que el ejercicio del derecho de acceso es gratuito (Art. 10)? |
| 10 | Secreto comercial | ¿Se incluyó la sección "ALCANCE DE ESTA SOLICITUD" que neutraliza el argumento de secreto comercial? |
| 11 | Art. 8° bis completo | ¿Se mencionan las 5 salvaguardas del inciso final? ¿Se indica que aplican incluso en excepciones? |
| 12 | Ley 20.575 | ¿Se incluyó el principio de finalidad para datos económicos? |
| 13 | Ley 19.496 | ¿Se incluyó el derecho a información del consumidor? |
| 14 | Disclaimer final | ¿El documento cierra con la advertencia de que no constituye asesoría jurídica? |
| 15 | idNorma BCN | ¿Cada ley citada tiene su idNorma BCN en el pie? |
| 16 | Coherencia interna | ¿Los hechos de la Sección II coinciden con lo que el usuario relató? |
| 17 | Concordancia de género | ¿El documento usa género correcto o inclusivo en todo el texto? |
| 18 | Infracción citada | ¿La advertencia cita Art. 34 bis letra c) como infracción por no responder? |
