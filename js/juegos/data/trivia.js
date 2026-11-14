// Preguntas de la trivia. Cada una tiene la respuesta correcta primero (se mezclan al mostrar)
// y una explicación. Fuentes principales: RAE (etimologías), Zarrillo et al. 2018 (Nature Ecology & Evolution),
// ICCO (producción de cacao), historias institucionales de Arcor, Haribo, Ferrero y Chupa Chups,
// Merck Veterinary Manual (teobromina). Al sumar preguntas: solo datos verificables, con fuente.
export const TRIVIA = {
  facil: [
    { q: '¿De qué planta se obtiene el chocolate?', a: ['Del cacao', 'Del café', 'De la caña de azúcar', 'De la vainilla'], why: 'El chocolate se hace con las semillas (granos) del árbol de cacao, Theobroma cacao.' },
    { q: '¿Cuál es el relleno más típico del alfajor argentino?', a: ['Dulce de leche', 'Mermelada de frutilla', 'Crema chantilly', 'Miel'], why: 'El alfajor argentino clásico une dos tapitas con dulce de leche y se baña en chocolate o glaseado.' },
    { q: '¿Qué golosina tiene un palito para agarrarla?', a: ['El chupetín', 'La gomita', 'El confite', 'El malvavisco'], why: 'El chupetín (y la paletita) es un caramelo duro montado sobre un palito.' },
    { q: '¿Qué le da textura elástica a las gomitas?', a: ['Un gelificante como la gelatina o la pectina', 'El chocolate', 'La sal', 'El aire batido'], why: 'Las gomitas se elaboran con gelificantes: gelatina, pectina o almidón.' },
    { q: '¿Qué son las mielcitas?', a: ['Caramelo líquido en tubitos', 'Caramelos de menta', 'Chicles de miel', 'Alfajores chiquitos'], why: 'Las mielcitas son tubitos plásticos rellenos de caramelo líquido, un clásico de kiosco.' },
    { q: '¿En qué continente se originó el cacao?', a: ['América', 'África', 'Asia', 'Europa'], why: 'El cacao es originario de América. Hoy, sin embargo, la mayor parte se cultiva en África occidental.' },
    { q: '¿Por qué no hay que darle chocolate a un perro?', a: ['Tiene teobromina, que puede intoxicarlo', 'Porque solo engorda', 'Porque le da sueño', 'Porque no le gusta el sabor'], why: 'Los perros metabolizan muy lentamente la teobromina del chocolate y pueden intoxicarse.' },
    { q: '¿Qué forma tienen las gomitas más famosas creadas en Alemania en 1922?', a: ['Ositos', 'Gusanos', 'Estrellas', 'Dinosaurios'], why: 'Hans Riegel, fundador de Haribo, creó en 1922 los “ositos bailarines”, antecesores de los ositos de goma.' },
    { q: '¿Qué le da al confite su cáscara crocante?', a: ['Capas finas de azúcar', 'Una capa de sal', 'Galletita molida', 'Hielo'], why: 'Los confites se hacen en bombos giratorios donde el centro recibe capa tras capa de azúcar.' },
    { q: '¿Cuál de estos es un snack salado de copetín?', a: ['Chizitos', 'Malvavisco', 'Mielcita', 'Paletita'], why: 'Los chizitos son palitos de maíz inflado sabor queso, un clásico del copetín.' },
    { q: '¿Qué ingrediente es la base grasa del chocolate?', a: ['La manteca de cacao', 'El aceite de girasol', 'La manteca de maní', 'La crema de leche'], why: 'La manteca de cacao es la grasa natural del grano de cacao.' },
    { q: '¿Cuál de estas golosinas es esponjosa y se puede tostar al fuego?', a: ['El malvavisco', 'El chicle', 'El regaliz', 'La mielcita'], why: 'El malvavisco es una espuma de azúcar y gelatina; al tostarlo se carameliza por fuera.' }
  ],
  media: [
    { q: '¿Qué significa “Theobroma”, el nombre científico del cacao?', a: ['Alimento de los dioses', 'Fruto amargo', 'Árbol de la selva', 'Semilla dorada'], why: 'Theobroma viene del griego: “theos” (dios) y “broma” (alimento). Lo eligió Linneo en 1753.' },
    { q: '¿Qué país es el mayor productor de cacao del mundo?', a: ['Costa de Marfil', 'Brasil', 'Ecuador', 'Suiza'], why: 'Según la Organización Internacional del Cacao, Costa de Marfil es el principal productor mundial.' },
    { q: '¿En qué país se desarrolló el chocolate con leche?', a: ['Suiza', 'Bélgica', 'México', 'Francia'], why: 'El suizo Daniel Peter lo desarrolló en 1875 usando la leche condensada de Henri Nestlé.' },
    { q: '¿En qué ciudad de Córdoba nació Arcor?', a: ['Arroyito', 'Río Segundo', 'Villa María', 'Río Cuarto'], why: 'Arcor se fundó en 1951 en Arroyito, provincia de Córdoba.' },
    { q: '¿Por qué el chocolate se derrite en la boca?', a: ['Su manteca de cacao se funde cerca de la temperatura del cuerpo', 'Porque tiene agua', 'Por el azúcar', 'Porque está hueco'], why: 'La manteca de cacao se funde a una temperatura cercana a la corporal: firme en la mano, cremosa en la boca.' },
    { q: '¿De dónde viene el nombre del malvavisco?', a: ['De una planta llamada malvavisco', 'De un pueblo francés', 'De su inventor', 'De la palabra “nube”'], why: 'Antiguamente se elaboraba con la raíz de la planta de malvavisco (Althaea officinalis).' },
    { q: '¿Qué raíz le da su sabor clásico al regaliz?', a: ['La raíz de regaliz', 'El jengibre', 'La mandioca', 'La remolacha'], why: 'El regaliz tradicional lleva extracto de la raíz de Glycyrrhiza glabra, de sabor anisado.' },
    { q: '¿De qué idioma viene la palabra “alfajor”?', a: ['Del árabe', 'Del latín', 'Del quechua', 'Del italiano'], why: 'Según la RAE, “alfajor” proviene del árabe hispánico.' },
    { q: '¿Qué es “templar” el chocolate?', a: ['Calentarlo y enfriarlo de forma controlada', 'Mezclarlo con agua tibia', 'Guardarlo en la heladera', 'Agregarle sal'], why: 'El templado hace que la manteca de cacao cristalice de forma estable: así queda brillante y crocante.' },
    { q: '¿Qué empresa creó los ositos de goma?', a: ['Haribo', 'Arcor', 'Nestlé', 'Ferrero'], why: 'Haribo, fundada por Hans Riegel en Bonn, Alemania, en 1920, lanzó los ositos en 1922.' },
    { q: '¿Qué NO tiene el chocolate blanco?', a: ['Pasta de cacao', 'Azúcar', 'Leche', 'Manteca de cacao'], why: 'El chocolate blanco lleva manteca de cacao, azúcar y leche, pero no los sólidos (pasta) de cacao.' },
    { q: 'El chicle se hacía originalmente con la savia de un árbol americano. ¿Cuál?', a: ['El chicozapote', 'El pino', 'El ombú', 'La palmera'], why: 'El chicle natural es el látex del chicozapote, árbol de México y Centroamérica.' }
  ],
  dificil: [
    { q: '¿Hace cuántos años se consumía cacao en la Amazonía de Ecuador, según la evidencia más antigua?', a: ['Unos 5.300 años', 'Unos 500 años', 'Unos 1.500 años', 'Unos 15.000 años'], why: 'Restos de la cultura Mayo-Chinchipe en Santa Ana-La Florida muestran uso de cacao hace unos 5.300 años (Zarrillo et al., 2018).' },
    { q: '¿En qué año Linneo bautizó al cacao como Theobroma cacao?', a: ['1753', '1492', '1810', '1901'], why: 'Fue en su obra Species Plantarum, de 1753.' },
    { q: '¿Quién desarrolló el chocolate con leche en 1875?', a: ['Daniel Peter', 'Henri Nestlé', 'Rodolphe Lindt', 'Milton Hershey'], why: 'Daniel Peter lo logró combinando chocolate con la leche condensada de su vecino Henri Nestlé.' },
    { q: '¿En qué año se fundó Arcor?', a: ['1951', '1910', '1972', '1985'], why: 'Arcor nació el 5 de julio de 1951 en Arroyito, Córdoba.' },
    { q: '¿Qué sustancia del chocolate es peligrosa para los perros?', a: ['La teobromina', 'La lactosa', 'La sacarosa', 'La pectina'], why: 'La teobromina es un alcaloide que los perros eliminan muy lentamente.' },
    { q: '¿Qué significa el nombre HARIBO?', a: ['Hans Riegel Bonn', 'Harina y bombones', 'Happy Ribbon Box', 'Hamburgo Ribera Bonn'], why: 'Es la sigla de su fundador, Hans Riegel, y de su ciudad, Bonn.' },
    { q: '¿Qué gelificante de origen vegetal, presente en las frutas, se usa en muchas gomitas?', a: ['La pectina', 'La gelatina', 'El colágeno', 'La caseína'], why: 'La pectina se obtiene de frutas como la manzana y los cítricos; la gelatina, en cambio, es de origen animal.' },
    { q: '¿En qué país nació Chupa Chups?', a: ['España', 'Italia', 'Argentina', 'Estados Unidos'], why: 'Enric Bernat lanzó Chupa Chups en 1958 en Cataluña, España.' },
    { q: '¿Qué empresa italiana creó la Nutella?', a: ['Ferrero', 'Arcor', 'Haribo', 'Bonafide'], why: 'Ferrero lanzó Nutella en 1964 en Alba, Italia.' },
    { q: '¿Qué pueblo de Mesoamérica usaba granos de cacao como moneda?', a: ['Los mexicas (aztecas)', 'Los incas', 'Los vikingos', 'Los egipcios'], why: 'Los mexicas usaban granos de cacao como medio de pago y para tributos.' },
    { q: '¿Qué cultura de la Amazonía ecuatoriana dejó la evidencia más antigua de uso del cacao?', a: ['Mayo-Chinchipe', 'Inca', 'Maya', 'Guaraní'], why: 'El hallazgo en Santa Ana-La Florida pertenece a la cultura Mayo-Chinchipe.' },
    { q: 'La teobromina del chocolate pertenece a la misma familia química que…', a: ['La cafeína', 'El azúcar', 'La vitamina C', 'El gluten'], why: 'Teobromina y cafeína son metilxantinas, compuestos estimulantes emparentados.' }
  ]
};
