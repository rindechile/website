'use client';

export default function MethodologyPage() {
  return (
    <article className="max-w-3xl mx-auto py-16">
      {/* Header Section */}
      <header className="text-center mb-12">
        <h1 className="text-3xl tablet:text-5xl desktop:text-6xl font-medium mb-6 leading-tight">
          Cómo detectamos sobreprecios en compras municipales
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Nuestro análisis parte de dos preguntas fundamentales: ¿qué define que una compra sea "cara"? y ¿dónde está el límite entre un precio elevado justificable y una anomalía estadística?
        </p>
      </header>

      {/* Divider */}
      <hr className="border-t border-border mb-12" />

      {/* Article Content */}
      <div className="article-content">
        <p className="text-base leading-relaxed mb-6">
          Para responder estas preguntas, desarrollamos una metodología basada en datos que permite identificar compras que se desvían significativamente de los patrones normales del mercado público chileno.
        </p>

        <p className="text-base leading-relaxed mb-6">
          El primer paso fue organizar los productos de manera sistemática. Las compras públicas en Chile utilizan el código <strong>UNSPSC</strong> (United Nations Standard Products and Services Code)<sup><a href="#ref1" className="text-secondary hover:underline">[1]</a></sup>, un sistema de clasificación internacional que permite comparar productos similares entre sí. Utilizando el nivel más específico de esta clasificación, agrupamos productos comparables y analizamos el historial de precios pagados por cada uno.
        </p>

        <h2 className="text-2xl font-medium mt-12 mb-4">
          El "Rango Esperado": definiendo la normalidad estadística
        </h2>

        <p className="text-base leading-relaxed mb-6">
          El concepto central de nuestra metodología es el <strong>"Rango Esperado"</strong>. Es importante aclarar que no se trata de una fijación de precios ni de una norma legal, sino de una lectura estadística de la realidad del mercado público.
        </p>

        <p className="text-base leading-relaxed mb-6">
          Este rango indica cuánto paga la mayoría de las municipalidades chilenas por un mismo producto. Específicamente, contiene el 50% central de todas las órdenes de compra municipales descargadas desde el portal oficial de ChileCompra<sup><a href="#ref2" className="text-secondary hover:underline">[2]</a></sup>. Si una municipalidad compra dentro de este rango, está pagando lo mismo que la mayoría de sus pares.
        </p>

        <p className="text-base leading-relaxed mb-6">
          Ahora bien, estar fuera del rango esperado no implica necesariamente una irregularidad. Existen razones legítimas para pagar más: urgencia en la adquisición, ubicación geográfica remota o especificaciones técnicas particulares, entre otras. Por eso desarrollamos una herramienta más precisa para detectar aquellas compras que verdaderamente se escapan de lo normal.
        </p>

        <h2 className="text-2xl font-medium mt-12 mb-4">
          Detección de anomalías estadísticas
        </h2>

        <p className="text-base leading-relaxed mb-6">
          Para identificar compras excepcionalmente caras, buscamos aquellas que se desvían significativamente de los patrones normales. Utilizamos la técnica del <strong>Rango Intercuartílico (IQR)</strong>, una herramienta estadística ampliamente reconocida para la detección de valores atípicos.
        </p>

        <p className="text-base leading-relaxed mb-6">
          Si ordenamos todos los precios pagados históricamente de menor a mayor:
        </p>

        <ul className="ml-6 space-y-3 mb-6 list-disc">
          <li><strong className="formula-inline">Q<sub>1</sub></strong> (Primer cuartil): el precio por debajo del cual se encuentra el 25% más económico de las compras.</li>
          <li><strong className="formula-inline">Q<sub>3</sub></strong> (Tercer cuartil): el precio por debajo del cual se encuentra el 75% de las compras.</li>
        </ul>

        <p className="text-base leading-relaxed mb-6">
          La diferencia entre estos valores constituye el IQR, que representa el "ancho" de la zona donde opera la mayoría del mercado:
        </p>

        <div className="formula">
          IQR = Q<sub>3</sub> − Q<sub>1</sub>
        </div>

        <h3 className="text-xl font-medium mt-10 mb-4">
          ¿Cuándo se activa una alerta?
        </h3>

        <p className="text-base leading-relaxed mb-6">
          No marcamos como alerta cualquier precio que supere el promedio o el tercer cuartil. Aplicamos un criterio más estricto: una compra se clasifica como <strong>excepcionalmente cara</strong> solo si supera el límite superior del mercado (Q<sub className="formula-inline">3</sub>) más un margen de seguridad considerable.
        </p>

        <p className="text-base leading-relaxed mb-6">
          La fórmula es:
        </p>

        <div className="formula">
          Alerta si: P<sub>i</sub> &gt; Q<sub>3</sub> + (λ · IQR)
        </div>

        <p className="text-base leading-relaxed mb-6">
          Donde:
        </p>

        <ul className="ml-6 space-y-3 mb-6 list-disc">
          <li><span className="formula-inline">P<sub>i</sub></span> es el precio unitario pagado por la municipalidad en la transacción.</li>
          <li><span className="formula-inline">λ = 2.0</span> es el factor de tolerancia, que exige que el precio supere en dos veces el rango intercuartílico al tercer cuartil para considerarlo anomalía.</li>
        </ul>

        <p className="text-base leading-relaxed mb-6">
          Este criterio evita generar alertas por precios levemente superiores al promedio, enfocándose exclusivamente en valores extremos que ameritan revisión.
        </p>

        <h2 className="text-2xl font-medium mt-12 mb-4">
          Filtros de calidad
        </h2>

        <p className="text-base leading-relaxed mb-6">
          Para minimizar falsos positivos y enfocar el análisis en situaciones relevantes, aplicamos tres filtros de validación. Una alerta solo se genera si cumple simultáneamente:
        </p>

        <ol className="ml-6 space-y-3 mb-6 list-decimal">
          <li><strong>Suficiencia estadística:</strong> el producto debe tener al menos 10 transacciones registradas (N &gt; 10), garantizando que la distribución no esté sesgada por datos escasos.</li>
          <li><strong>Materialidad del sobreprecio:</strong> la diferencia entre el precio pagado y el límite superior del rango esperado debe superar los $10.000 CLP, evitando alertas por diferencias insignificantes.</li>
          <li><strong>Significancia de la orden:</strong> el monto total de la orden debe ser superior a $100.000 CLP, concentrando el análisis en transacciones con impacto presupuestario real.</li>
        </ol>

        <h2 className="text-2xl font-medium mt-12 mb-4">
          Limitaciones y consideraciones
        </h2>

        <p className="text-base leading-relaxed mb-6">
          Es fundamental interpretar estos resultados considerando las limitaciones metodológicas y las características del sistema de compras públicas:
        </p>

        <ol className="ml-6 space-y-6 mb-6 list-decimal">
          <li>
            <strong>Errores de digitación:</strong>
            <p className="mt-2 text-muted-foreground">Las instituciones a veces cometen errores al ingresar información. Un caso frecuente es registrar "1 unidad" cuando realmente se adquirió una caja de 100 unidades, lo que eleva artificialmente el precio unitario aparente. Estos errores administrativos no reflejan irregularidades en la compra, sino en el registro.</p>
          </li>
          <li>
            <strong>Agrupación incorrecta de productos:</strong>
            <p className="mt-2 text-muted-foreground">Ocurre cuando una orden compuesta por múltiples artículos (por ejemplo: bebidas, pan y dulces para un evento) se registra bajo un único código UNSPSC con cantidad "1 unidad", inflando artificialmente el precio unitario. Por esta razón, recomendamos verificar la orden de compra original antes de sacar conclusiones. A futuro, sería deseable avanzar hacia una estandarización más rigurosa en el registro de compras.</p>
          </li>
          <li>
            <strong>Variabilidad inherente en la clasificación UNSPSC:</strong>
            <p className="mt-2 text-muted-foreground">La clasificación <strong>UNSPSC</strong>, aunque es el estándar más utilizado, admite cierta variabilidad legítima en los precios dentro de un mismo código. Esto ocurre porque productos con el mismo código pueden diferir en calidad, marca o especificaciones técnicas. Por ejemplo, "sillas de oficina" puede incluir desde modelos básicos hasta ergonómicos de alta gama. Factores como la ubicación geográfica, urgencia o volúmenes pequeños también pueden justificar precios más elevados. Por este motivo, utilizamos una técnica estadística que detecta solo casos extremos. Los rangos esperados deben interpretarse como referencias orientadoras, no como límites absolutos.</p>
          </li>
          <li>
            <strong>Estimación del presupuesto per cápita municipal:</strong>
            <p className="mt-2 text-muted-foreground">Los cálculos de capacidad económica municipal son referenciales. Se obtienen cruzando datos de ejecución presupuestaria del portal Presupuesto Abierto<sup><a href="#ref3" className="text-secondary hover:underline">[3]</a></sup> con proyecciones demográficas del INE basadas en el Censo 2017, ajustadas para 2015<sup><a href="#ref4" className="text-secondary hover:underline">[4]</a></sup>.</p>
            <p className="mt-2 text-muted-foreground">El resultado es un indicador aproximado que busca responder: ¿de cuántos recursos dispone la municipalidad por habitante? Este valor no debe interpretarse como un estado financiero auditado.</p>
          </li>
          <li>
            <strong>Ventana temporal limitada:</strong>
            <p className="mt-2 text-muted-foreground">Este análisis abarca el período 2015-2024. Un histórico más extenso mejoraría la precisión de los rangos de referencia, especialmente para productos cuyo mercado ha experimentado cambios significativos.</p>
          </li>
        </ol>

        <div className="note">
          <strong>Nota final:</strong> Esta metodología es una herramienta de análisis exploratorio diseñada para identificar patrones que merezcan revisión, no un instrumento de auditoría definitivo. Cada alerta debe evaluarse considerando el contexto específico de la compra, las características del territorio y las justificaciones administrativas pertinentes.
        </div>

        <section className="references">
          <h2 className="text-xl font-medium mb-4">Referencias</h2>
          <ol className="space-y-2 list-decimal ml-6">
            <li id="ref1">United Nations Development Programme (UNDP). <em>United Nations Standard Products and Services Code (UNSPSC)</em>. <a href="https://www.undp.org/unspsc" target="_blank" rel="noopener noreferrer" className="text-secondary hover:underline">https://www.undp.org/unspsc</a>. Accedido el: 2025-12-02.</li>
            <li id="ref2"><em>Datos Abiertos ChileCompra</em>. <a href="https://datos-abiertos.chilecompra.cl/descargas" target="_blank" rel="noopener noreferrer" className="text-secondary hover:underline">https://datos-abiertos.chilecompra.cl/descargas</a>. Accedido el: 2025-02-12.</li>
            <li id="ref3"><em>Presupuesto Abierto Municipal</em>. <a href="https://presupuestoabierto.gob.cl/municipalities" target="_blank" rel="noopener noreferrer" className="text-secondary hover:underline">https://presupuestoabierto.gob.cl/municipalities</a>. Accedido el: 2025-02-12.</li>
            <li id="ref4"><em>Proyecciones de Población — INE</em>. <a href="https://regiones.ine.cl/biobio/estadisticas-regionales/sociales/demografia-y-vitales/proyecciones-de-poblacion" target="_blank" rel="noopener noreferrer" className="text-secondary hover:underline">https://regiones.ine.cl/biobio/estadisticas-regionales/sociales/demografia-y-vitales/proyecciones-de-poblacion</a>. Accedido el: 2025-02-12.</li>
          </ol>
        </section>
      </div>
    </article>
  );
}
