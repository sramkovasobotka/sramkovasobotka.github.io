<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" 
                xmlns:html="http://www.w3.org/TR/REC-html40"
                xmlns:sitemap="http://www.sitemaps.org/schemas/sitemap/0.9"
                xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
	<xsl:output method="html" version="1.0" encoding="UTF-8" indent="yes" />
	<xsl:template match="/">
		<html xmlns="http://www.w3.org/1999/xhtml">
			<head>
				<title>XML mapa webu</title>
				<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
				<meta name="robots" content="noindex,follow" />
				<style type="text/css">
					body {
						font-family:"Roboto",Helvetica,Arial,Lucida,sans-serif;
					}
					
					#intro {
						background-color:#fff1f1;
						border:1px #ff1f1f solid;
						padding:5px 13px 5px 13px;
						margin:10px;
					}
					
					#intro p {
						line-height: 1.5em;
					}
					#intro strong {
						font-weight: normal;
					}
					table {width: 100%;}
					
					th {
						text-align: left;
						padding-right: 30px;
					}
					
					tr.high {
						background-color: whitesmoke;
					}
					
					#footer {
						padding: 2px;
						margin-top: 10px;
						font-size: 0.8em;
						color:darkgray;
					}
					
					#footer a {
						color:darkgray;
					}
					
					a {
						color:black;
					}
				</style>
			</head>
			<body>
				<xsl:apply-templates></xsl:apply-templates>
				<div id="footer">
					Formátovací xsl soubor mapy je inspirován <a rel="external nofollow" href="http://www.arnebrachhold.de/redir/sitemap-home/" title="Google (XML) Sitemap Generator Plugin for WordPress">Google (XML) Sitemaps Generator Plugin for WordPress</a>. XML obsah ale není generováno zásuvným modulem.
				</div>
			</body>
		</html>
	</xsl:template>
	
	
	<xsl:template match="sitemap:urlset">
        <h1>XML mapa webu</h1>
        <div id="intro">
            <p>
                Toto je mapa webu ve formátu xml generovaná pro internetové vyhledávače.<br />
                <a rel="external nofollow" href="https://cs.wikipedia.org/wiki/Sitemap">Definici takové mapy</a> najdete třeba na české wikipedii.</p>
             <p style="text-align: right;">kontakt na správce webu je <em>admin</em> na <em>sramkovasobotka.cz</em>.</p>
        </div>
		<div id="content">
			<table cellpadding="5">
				<tr style="border-bottom:1px black solid;">
					<th>lokátor umístění</th>
					<th>priorita</th>
					<th>četnost změn</th>
					<th>poslední změna (UTC)</th>
				</tr>
				<xsl:variable name="lower" select="'abcdefghijklmnopqrstuvwxyz'"/>
				<xsl:variable name="upper" select="'ABCDEFGHIJKLMNOPQRSTUVWXYZ'"/>
				<xsl:for-each select="./sitemap:url">
					<tr>
						<xsl:if test="position() mod 2 != 1">
							<xsl:attribute  name="class">high</xsl:attribute>
						</xsl:if>
						<td>
							<xsl:variable name="itemURL">
								<xsl:value-of select="sitemap:loc"/>
							</xsl:variable>
							<a href="{$itemURL}">
								<xsl:value-of select="sitemap:loc"/>
							</a>
						</td>
						<td>
							<xsl:value-of select="concat(sitemap:priority*100,'%')"/>
						</td>
						<td>
							<xsl:value-of select="concat(translate(substring(sitemap:changefreq, 1, 1),concat($lower, $upper),concat($upper, $lower)),substring(sitemap:changefreq, 2))"/>
						</td>
						<td>
							<xsl:value-of select="concat(substring(sitemap:lastmod,0,11),concat(' ', substring(sitemap:lastmod,12,5)))"/>
						</td>
					</tr>
				</xsl:for-each>
			</table>
		</div>
	</xsl:template>
	
	
	<xsl:template match="sitemap:sitemapindex">
        <h1>index XML map webu</h1>
        <div id="intro">
            <p>
                Původní text: This is a XML Sitemap which is supposed to be processed by search engines which follow the XML Sitemap standard like Ask.com, Bing, Google and Yahoo.<br />
                It was generated using the <a rel="external nofollow" href="http://wordpress.org/">WordPress</a> content management system and the <strong><a rel="external nofollow" href="http://www.arnebrachhold.de/redir/sitemap-home/" title="Google (XML) Sitemaps Generator Plugin for WordPress">Google Sitemap Generator Plugin</a></strong> by <a rel="external nofollow" href="http://www.arnebrachhold.de/">Arne Brachhold</a>.<br />
                You can find more information about XML sitemaps on <a rel="external nofollow" href="http://sitemaps.org/">sitemaps.org</a> and Google's <a rel="external nofollow" href="http://code.google.com/p/sitemap-generators/wiki/SitemapGenerators">list of sitemap programs</a>.<br />
                <br />
                This file contains links to sub-sitemaps, follow them to see the actual sitemap content.
            </p>
        </div>
		<div id="content">
			<table cellpadding="5">
				<tr style="border-bottom:1px black solid;">
					<th>URL of sub-sitemap</th>
					<th>Last modified (GMT)</th>
				</tr>
				<xsl:for-each select="./sitemap:sitemap">
					<tr>
						<xsl:if test="position() mod 2 != 1">
							<xsl:attribute  name="class">high</xsl:attribute>
						</xsl:if>
						<td>
							<xsl:variable name="itemURL">
								<xsl:value-of select="sitemap:loc"/>
							</xsl:variable>
							<a href="{$itemURL}">
								<xsl:value-of select="sitemap:loc"/>
							</a>
						</td>
						<td>
							<xsl:value-of select="concat(substring(sitemap:lastmod,0,11),concat(' ', substring(sitemap:lastmod,12,5)))"/>
						</td>
					</tr>
				</xsl:for-each>
			</table>
		</div>
	</xsl:template>
</xsl:stylesheet>