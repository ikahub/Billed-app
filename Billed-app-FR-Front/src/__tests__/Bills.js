/**
 * @jest-environment jsdom
 */

 import "@testing-library/jest-dom"
 import { screen, getByTestId, getAllByTestId, getByText, waitFor } from "@testing-library/dom"
 import userEvent from "@testing-library/user-event"
 import BillsUI from "../views/BillsUI.js"
 import Bills from "../containers/Bills.js"
 import { ROUTES, ROUTES_PATH } from "../constants/routes"
 import { localStorageMock } from "../__mocks__/localStorage.js"
 import mockStore from "../__mocks__/store"
 import { bills } from "../fixtures/bills"
 import router from "../app/Router"
 
 jest.mock("../app/Store", () => mockStore)
 
 describe("Given I am connected as an employee", () => {
   describe("When I am on Bills Page", () => {
     test("Then bill icon should be highlighted", async () => {
 
       Object.defineProperty(window, 'localStorage', { value: localStorageMock })
       window.localStorage.setItem('user', JSON.stringify({
         type: 'Employee'
       }))
       const root = document.createElement("div")
       root.setAttribute("id", "root")
       document.body.append(root)
       router()
       window.onNavigate(ROUTES_PATH.Bills)
       await waitFor(() => screen.getByTestId('icon-window'))
       const windowIcon = screen.getByTestId('icon-window')
       expect(windowIcon).toHaveClass('active-icon')
 
     })
     test("Then bills are ordered from earliest to latest", () => {
       document.body.innerHTML = BillsUI({ data: bills })
       const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
       const antiChrono = (a, b) => ((a < b) ? 1 : -1)
       const datesSorted = bills.map(d => d.date).sort(antiChrono)
       expect(dates).toEqual(datesSorted)
     })
   })
 
   describe("When I click on the button 'Nouvelle note de frais'", () => {
     test("Then I should navigate to #employee/bill/new", () => {
       const onNavigate = (pathname) => {
         document.body.innerHTML = ROUTES({ pathname })
       }
       Object.defineProperty(window, 'localStorage', { value: localStorageMock })
       window.localStorage.setItem('user', JSON.stringify({
         type: 'Employee'
       }))
       const billsPage = new Bills({
         document, onNavigate, store: null, bills: bills, localStorage: window.localStorage
       })
       const handleClickNewBill = jest.fn(billsPage.handleClickNewBill);
       const btnNewBill = getByTestId(document.body, "btn-new-bill");
       btnNewBill.addEventListener("click", handleClickNewBill);
       userEvent.click(btnNewBill);
       expect(handleClickNewBill).toHaveBeenCalled();
       expect(
         getByText(document.body, "Envoyer une note de frais")
       ).toBeTruthy();
     });
   });
 
   describe("When I click on the eye icon", () => {
     test("A modal should open", () => {
       const onNavigate = (pathname) => {
         document.body.innerHTML = ROUTES({ pathname })
       }
       Object.defineProperty(window, 'localStorage', { value: localStorageMock })
       window.localStorage.setItem('user', JSON.stringify({
         type: 'Employee'
       }))
       const billsPage = new Bills({
         document, onNavigate, store: null, bills: bills, localStorage: window.localStorage
       })
       document.body.innerHTML = BillsUI({ data: { bills } })
       $.fn.modal = jest.fn();
       const firstEyeIcon = getAllByTestId(document.body, "btn-new-bill")[0];
       const handleClickIconEye = jest.fn(
         billsPage.handleClickIconEye(firstEyeIcon)
       );
       firstEyeIcon.addEventListener("click", handleClickIconEye);
       userEvent.click(firstEyeIcon);
       expect(handleClickIconEye).toHaveBeenCalled();
       const modal = screen.getByTestId("modale");
       expect(modal).toBeTruthy();
     });
   });

   describe("When I navigate to Bills page", () => {
     describe("When we use API", () => {
       beforeEach(() => {
         jest.spyOn(mockStore, "bills")
         Object.defineProperty(
           window,
           'localStorage',
           { value: localStorageMock }
         )
         window.localStorage.setItem('user', JSON.stringify({
           type: 'Employee',
           email: "a@a"
         }))
         const root = document.createElement("div")
         root.setAttribute("id", "root")
         document.body.appendChild(root)
         router()
       })
       test("Bills fetch from API", async () => {
         const bills = await mockStore.bills().list()
         expect(bills.length).toBe(4);
       })
       test("fBills fetch from mock API", async () => {
         window.onNavigate(ROUTES_PATH.Bills)
         await new Promise(process.nextTick);
         const message = await screen.getByText("encore")
         expect(message).toBeTruthy()
       })
       test("404 message error when fetcg API", async () => {
         mockStore.bills.mockImplementationOnce(() => {
           return {
             list: () => {
               return Promise.reject(new Error("Erreur 404"))
             }
           }
         })
         window.onNavigate(ROUTES_PATH.Bills)
         await new Promise(process.nextTick);
         const message = await screen.getByText(/Erreur 404/)
         expect(message).toBeTruthy()
       })
       test("500 message error when fetch API", async () => {
         mockStore.bills.mockImplementationOnce(() => {
           return {
             list: () => {
               return Promise.reject(new Error("Erreur 500"))
             }
           }
         })
         window.onNavigate(ROUTES_PATH.Bills)
         await new Promise(process.nextTick);
         const message = await screen.getByText(/Erreur 500/)
         expect(message).toBeTruthy()
       })
     });
   });
 })
 
