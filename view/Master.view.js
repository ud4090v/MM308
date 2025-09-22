<mvc:View
	controllerName="lmco.ces.preq.controller.Master"
	xmlns="sap.m"
	xmlns:mvc="sap.ui.core.mvc"
	xmlns:core="sap.ui.core"
	xmlns:semantic="sap.f.semantic">
	<semantic:SemanticPage id="page"
		core:require="{
			formatMessage: 'sap/base/strings/formatMessage',
			DateType: 'sap/ui/model/type/Date'
		}">
		<!-- <semantic:titleHeading>
			<Title
				id="masterHeaderTitle"
				text="{
					parts: [
						'i18n>masterTitleCount',
						'masterView>/titleCount'
					],
					formatter: 'formatMessage'
			}"/>
		</semantic:titleHeading> -->
		<semantic:content>
			<!-- For client side filtering add this to the items attribute: parameters: {operationMode: 'Client'}}" -->
			<VBox  fitContainer="true" renderType="Bare" width="100%">
				<IconTabHeader
					id="masterTabBar"
					mode="Inline"
					backgroundDesign="Transparent"
					select=".onMasterTabSelect"
					selectedKey="{masterView>/selectedTab}">
					<items>
						<IconTabFilter
							id="iconMasterFilterReview"
							count="{appView>/iApprCnt}"
							text="My Queue"
							icon="sap-icon://cart-approval"
							tooltip="Request Items"
							key="review">
						</IconTabFilter>
						<IconTabFilter
							id="iconMasterFilterSubmitted"
							count="{appView>/iSubmitCnt}"
							text="For Review"
							icon="sap-icon://cart-approval"
							tooltip="Request Items"
							key="submitted">
						</IconTabFilter>
						<IconTabFilter
							id="iconMasterFilterMyList"
							count="{appView>/iCnt}"
							icon="sap-icon://credit-card"
							text="My Purchases"
							tooltip="My Purchase Requests"
							key="mylist">
						</IconTabFilter>
						<IconTabFilter
							id="iconMasterFilterHistory"
							text="Past Requests"
							count="{appView>/iHistCnt}"
							icon="sap-icon://history"
							tooltip="Past requests"
							key="history">
						</IconTabFilter>
					</items>
				</IconTabHeader>
			<List
				id="__preqList"
				width="auto"
				class="sapFDynamicPageAlignContent"
				items="{}"
				busyIndicatorDelay="{masterView>/delay}"
				noDataText="{masterView>/noDataText}"
				mode="{= ${device>/system/phone} ? 'None' : 'SingleSelectMaster'}"
				growing="true"
				growingScrollToLoad="true"
				updateFinished=".onUpdateFinished"
				selectionChange=".onSelectionChange">
				<infoToolbar>
					<Toolbar
						active="true"
						id="filterBar"
						visible="{masterView>/isFilterBarVisible}"
						press=".onOpenViewSettings">
						<Title
							id="filterBarLabel"
							text="{masterView>/filterBarLabel}" />
					</Toolbar>
				</infoToolbar>
				<headerToolbar>
					<OverflowToolbar>
						<!-- <Title
							id="masterHeaderTitle"
							titleStyle="H6"
							text="{
								parts: [
									'i18n>masterTitleCount',
									'masterView>/titleCount'
								],
								formatter: 'formatMessage'
							}"
						/>
 -->
						<SearchField
							id="searchField"
							showRefreshButton="true"
							tooltip="{i18n>masterSearchTooltip}"
							width="100%"
							search=".onSearch">
							<layoutData>
								<OverflowToolbarLayoutData
									minWidth="150px"
									maxWidth="240px"
									shrinkable="true"
									priority="NeverOverflow"/>
							</layoutData>
						</SearchField>

					<ComboBox
						id="_flt_Rev"
						showSecondaryValues= "false"
						selectedKey="{flt>/reviewer}"
						change = ".applyMasterFilter"
						visible = "{= ${appView>/opmode}==='S'  }"
						loadItems=".handleLoadReviewList"
						items="{
							path: '/ReviewSet',
							sorter: { path: 'Gal' },
							suspended: true,
							templateShareable: false
						}">
						<core:ListItem key="{Ntid}" text="{Gal}"/>
					</ComboBox>				


						<ToolbarSpacer/>
						<Button
							id="newReqButton"
							press=".onCreateNewRequest"
							icon="sap-icon://add"
							visible="{
								parts: [
									{path: 'appView>/opmode'}
								],
								formatter:'.formatter.NewReqBtnVisible'
							}"
							type="Transparent"/>
						<Button
							id="groupButton"
							press=".onOpenViewSettings"
							icon="sap-icon://group-2"
							type="Transparent"/>
					</OverflowToolbar>
				</headerToolbar>
				<items>
					<ObjectListItem
						icon="{
								parts: [
									{path: 'bRepair'}
								],
								formatter:'.formatter.ReqIcon'
							}"
						type="{= ${device>/system/phone} ? 'Active' : 'Inactive'}"
						press=".onSelectionChange"
						highlight="{
									parts: [
										{path: 'Status'}
									],
									formatter:'.formatter.StatusState'
								}"
						title="{PrqNo}"
						intro="{
							parts: [
								'PreqName',
								'PreqText',
								'PrqNo',
								'bRepair'
							],
							formatter: '.formatter.formatIntro'
						}"
						number="{
							parts:[{path:'PrrTotal'},{path:'Waers'}],
							type: 'sap.ui.model.type.Currency',
							formatOptions: {showMeasure: false}
						}"
						numberUnit="{Waers}">						
						<firstStatus>
							<ObjectStatus
								inverted="true"
								state="Information"
								visible="{bRepair}"
								text="REPAIR"/>

						</firstStatus>

						<secondStatus >
							<ObjectStatus
								inverted="true"
								state="{
									parts: [
										{path: 'Status'}
									],
									formatter:'.formatter.StatusState'
								}"
								text="{StatusText}"/>


						</secondStatus>



						<attributes>
							
							<ObjectAttribute text="Plant: {Plant}: {PlantName}" />

							<ObjectAttribute title="Created On"
								text="{
									parts: [
										{path: 'CDat'},
										{path: 'CNameFull'}
									],
									formatter:'.formatter.createdStamp'
								}"									
							/>

							<ObjectAttribute title="Changed On"
								text="{
									parts: [
										{path: 'ChDat'},
										{path: 'CHNameFull'}
									],
									formatter:'.formatter.createdStamp'
								}"									
							/>

							<ObjectAttribute title="Requested Reviewer"
								text="{InputterName}"									
							/>

							<ObjectAttribute title="Note to Reviewer"
								text="{NoteBuyer}"									
							/>


						</attributes>
					</ObjectListItem>
				</items>
			</List>

			</VBox>
		</semantic:content>
	</semantic:SemanticPage>
</mvc:View>
